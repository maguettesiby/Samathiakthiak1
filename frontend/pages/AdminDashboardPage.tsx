import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { mockApi } from '../services/mockDb';
import { Rider, RiderStatus } from '../types';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const AdminDashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    loadRiders();
  }, [user, navigate]);

  const loadRiders = async () => {
    try {
      const data = await mockApi.getRiders();
      setRiders(data);
    } catch (error) {
      console.error('Erreur lors du chargement des livreurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: RiderStatus) => {
    try {
      const needsNote = status === RiderStatus.DOCUMENTS_REQUIRED || status === RiderStatus.REJECTED;
      let note = '';
      if (needsNote) {
        const input = prompt(t('adminDashboard.notePrompt'));
        if (input === null) return;
        note = input.trim();
        if (!note) {
          alert(t('adminDashboard.noteRequired'));
          return;
        }
      }

      await mockApi.updateRiderStatus(id, status, note);
      setRiders(riders.map(r => (r.id === id ? { ...r, status, verificationNote: note || undefined } : r)));
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('adminDashboard.confirmDelete'))) return;
    try {
      await mockApi.deleteRider(id);
      setRiders(riders.filter(r => r.id !== id));
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const filteredRiders = riders.filter((rider) => {
    const term = search.toLowerCase().trim();
    if (!term) return true;
    return (
      rider.firstName.toLowerCase().includes(term) ||
      rider.lastName.toLowerCase().includes(term) ||
      rider.phone.toLowerCase().includes(term) ||
      (rider.address || '').toLowerCase().includes(term) ||
      rider.id.toString().toLowerCase().includes(term)
    );
  });

  return (
    <div className="bg-gradient-to-b from-blue-50/60 to-slate-50 min-h-screen">
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl md:text-4xl font-black text-blue-900 mb-3">
          {t('adminDashboard.title')}
        </h1>
        <p className="text-gray-600 mb-6">
          {t('adminDashboard.subtitle')}
        </p>

        <div className="flex justify-end mb-4">
          <div className="w-full md:w-72">
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-widest">
              {t('adminDashboard.searchLabel')}
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('adminDashboard.searchPlaceholder')}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-100">
          {loading ? (
            <div className="py-16 text-center">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-bold">
                {t('adminDashboard.loadingRiders')}
              </div>
            </div>
          ) : filteredRiders.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-gray-700 text-lg font-semibold mb-2">{t('adminDashboard.emptyTitle')}</p>
              <p className="text-gray-500 text-sm">{t('adminDashboard.emptySubtitle')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-blue-800 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">{t('adminDashboard.colIdentity')}</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">{t('adminDashboard.colPhone')}</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">{t('adminDashboard.colType')}</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">{t('adminDashboard.colDocuments')}</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">{t('adminDashboard.colStatus')}</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">{t('adminDashboard.colActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRiders.map((rider, index) => (
                    <tr
                      key={rider.id}
                      className={`border-b last:border-b-0 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}
                    >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {rider.profilePhotoUrl && (
                        <img
                          src={rider.profilePhotoUrl}
                          alt={`${rider.firstName} ${rider.lastName}`}
                          className="w-10 h-10 rounded-full object-cover border"
                        />
                      )}
                      <div>
                        <div className="font-bold">
                          {rider.firstName} {rider.lastName}
                        </div>
                        {rider.gender && (
                          <div className="text-xs text-gray-500">
                            {t('adminDashboard.genderLabel')}{' '}
                            {rider.gender === 'female'
                              ? t('adminDashboard.genderFemale')
                              : t('adminDashboard.genderMale')}
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          {t('adminDashboard.idLabel', { id: rider.id })}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">{rider.phone}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{rider.riderFunction}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2 text-xs">
                      <div>
                        <span className="font-semibold">{t('adminDashboard.docProfile')}&nbsp;</span>
                        {rider.profilePhotoUrl ? (
                          <a
                            href={rider.profilePhotoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 underline"
                          >
                            {t('adminDashboard.view')}
                          </a>
                        ) : (
                          <span className="text-gray-400">{t('adminDashboard.none')}</span>
                        )}
                      </div>
                      <div>
                        <span className="font-semibold">{t('adminDashboard.docIdCard')}&nbsp;</span>
                        {rider.idCardUrl ? (
                          <a
                            href={rider.idCardUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 underline"
                          >
                            {t('adminDashboard.view')}
                          </a>
                        ) : (
                          <span className="text-gray-400">{t('adminDashboard.none')}</span>
                        )}
                      </div>
                      <div>
                        <span className="font-semibold">{t('adminDashboard.docLicense')}&nbsp;</span>
                        {rider.licenseUrl ? (
                          <a
                            href={rider.licenseUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 underline"
                          >
                            {t('adminDashboard.view')}
                          </a>
                        ) : (
                          <span className="text-gray-400">{t('adminDashboard.none')}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={rider.status}
                      onChange={(e) => handleStatusChange(rider.id, e.target.value as RiderStatus)}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white"
                    >
                      {Object.values(RiderStatus).map((status) => (
                        <option key={status} value={status}>
                          {t(`adminDashboard.status.${status}`)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleDelete(rider.id)}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 text-sm font-semibold shadow-sm"
                    >
                      {t('adminDashboard.delete')}
                    </button>
                  </td>
                </tr>
              ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;


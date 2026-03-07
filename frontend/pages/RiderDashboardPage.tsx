import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { mockApi } from '../services/mockDb';
import { Rider, AvailabilityStatus, RiderStatus } from '../types';
import { AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const RiderDashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rider, setRider] = useState<Rider | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    profilePhoto: null as File | null,
  });
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  const [phoneForm, setPhoneForm] = useState({ phone: '' });
  const [phoneError, setPhoneError] = useState('');
  const [phoneSuccess, setPhoneSuccess] = useState('');

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadRiderData();
  }, [user, navigate]);

  const loadRiderData = async () => {
    try {
      const data = await mockApi.getMe();
      setRider(data);
      setProfileForm({
        firstName: data.firstName,
        lastName: data.lastName,
        profilePhoto: null,
      });
      setPhoneForm({ phone: data.phone || '' });
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvailabilityChange = async (status: AvailabilityStatus) => {
    if (!rider) return;
    try {
      await mockApi.updateAvailability(rider.id, status);
      setRider({ ...rider, availabilityStatus: status });
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rider) return;

    setProfileError('');
    setProfileSuccess('');

    try {
      const updated = await mockApi.updateRiderProfile(
        profileForm.firstName,
        profileForm.lastName,
        profileForm.profilePhoto
      );
      setRider(updated);
      setProfileSuccess(t('riderDashboard.profileUpdated'));
      setProfileForm((prev) => ({ ...prev, profilePhoto: null }));
    } catch (err: any) {
      setProfileError(err.message || t('riderDashboard.profileUpdateError'));
    }
  };

  const handleProfileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfileForm((prev) => ({ ...prev, profilePhoto: e.target.files![0] }));
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rider) return;

    setPhoneError('');
    setPhoneSuccess('');

    try {
      const updated = await mockApi.updateRiderPhone(phoneForm.phone);
      setRider(updated);
      setPhoneSuccess(t('riderDashboard.phoneUpdated'));
    } catch (err: any) {
      setPhoneError(err.message || t('riderDashboard.phoneUpdateError'));
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      setPasswordError(t('riderDashboard.passwordMismatch'));
      return;
    }

    try {
      await mockApi.changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword,
        passwordForm.confirmNewPassword
      );
      setPasswordSuccess(t('riderDashboard.passwordUpdated'));
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      });
    } catch (err: any) {
      setPasswordError(err.message || t('riderDashboard.passwordUpdateError'));
    }
  };

  return (
    <div className="page-shell">
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
          {t('riderDashboard.title')}
        </h1>
        <p className="text-slate-600 mb-8">
          {t('riderDashboard.subtitle')}
        </p>

        {loading && (
          <div className="card-modern p-8 mb-6">
            <div className="text-center text-slate-600 font-semibold">
              {t('riderDashboard.loadingProfile')}
            </div>
          </div>
        )}

        {!loading && !rider && (
          <div className="card-modern p-8 mb-6 border border-red-200">
            <div className="text-center text-red-700 font-semibold">
              {t('riderDashboard.loadError')}
            </div>
          </div>
        )}

        {rider && (
          <>
            {rider.status !== RiderStatus.ACTIVE && (
              <div
                className={`card-modern p-5 mb-6 border ${
                  rider.status === RiderStatus.PENDING
                    ? 'border-amber-200 bg-amber-50'
                    : rider.status === RiderStatus.DOCUMENTS_REQUIRED
                      ? 'border-blue-200 bg-blue-50'
                      : rider.status === RiderStatus.REJECTED
                        ? 'border-red-300 bg-gradient-to-br from-red-50 to-white shadow-sm'
                        : 'border-slate-200 bg-slate-50'
                }`}
              >
                {rider.status === RiderStatus.PENDING ? (
                  <div>
                    <p className="font-black text-amber-900">{t('riderDashboard.verification.pendingTitle')}</p>
                    <p className="text-amber-900 text-sm mt-1">
                      {t('riderDashboard.verification.pendingText')}
                    </p>
                  </div>
                ) : rider.status === RiderStatus.DOCUMENTS_REQUIRED ? (
                  <div>
                    <p className="font-black text-blue-900">{t('riderDashboard.verification.docsTitle')}</p>
                    <p className="text-blue-900 text-sm mt-1">
                      {t('riderDashboard.verification.docsText')}
                    </p>
                    {rider.verificationNote ? (
                      <p className="text-blue-900 text-sm mt-2">
                        <span className="font-bold">{t('riderDashboard.verification.noteLabel')}</span> {rider.verificationNote}
                      </p>
                    ) : null}
                  </div>
                ) : rider.status === RiderStatus.REJECTED ? (
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-red-100 border border-red-200">
                      <AlertTriangle className="h-5 w-5 text-red-700" />
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-red-950 text-lg">
                        {t('riderDashboard.verification.rejectedTitle')}
                      </p>
                      <p className="text-red-900 text-sm mt-1">
                        {t('riderDashboard.verification.rejectedText')}
                      </p>

                      {rider.verificationNote ? (
                        <div className="mt-3 rounded-xl border border-red-200 bg-white/70 px-4 py-3">
                          <p className="text-xs font-black uppercase tracking-widest text-red-700">
                            {t('riderDashboard.verification.noteLabel')}
                          </p>
                          <p className="text-sm text-red-950 mt-1 whitespace-pre-wrap">{rider.verificationNote}</p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="font-black text-slate-900">{t('riderDashboard.verification.genericTitle')}</p>
                    <p className="text-slate-700 text-sm mt-1">
                      {t('riderDashboard.verification.genericText')}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Statut de disponibilité - SECTION PRINCIPALE ET TRÈS VISIBLE */}
            <div className="card-modern p-6 mb-8 animate-fade-in-up">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-600 mb-1">{t('riderDashboard.availability')}</p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                        rider.availabilityStatus === AvailabilityStatus.ONLINE
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : rider.availabilityStatus === AvailabilityStatus.BUSY
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {rider.availabilityStatus === AvailabilityStatus.ONLINE
                        ? t('riderDashboard.statusOnline')
                        : rider.availabilityStatus === AvailabilityStatus.BUSY
                          ? t('riderDashboard.statusBusy')
                          : t('riderDashboard.statusOffline')}
                    </span>
                    <span className="text-xs text-slate-500">{t('riderDashboard.availabilityHint')}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => handleAvailabilityChange(AvailabilityStatus.ONLINE)}
                    className={
                      rider.availabilityStatus === AvailabilityStatus.ONLINE
                        ? 'btn-primary'
                        : 'btn-secondary'
                    }
                    type="button"
                  >
                    {t('riderDashboard.btnAvailable')}
                  </button>
                  <button
                    onClick={() => handleAvailabilityChange(AvailabilityStatus.BUSY)}
                    className={
                      rider.availabilityStatus === AvailabilityStatus.BUSY
                        ? 'btn-primary'
                        : 'btn-secondary'
                    }
                    type="button"
                  >
                    {t('riderDashboard.btnBusy')}
                  </button>
                  <button
                    onClick={() => handleAvailabilityChange(AvailabilityStatus.OFFLINE)}
                    className={
                      rider.availabilityStatus === AvailabilityStatus.OFFLINE
                        ? 'btn-primary'
                        : 'btn-secondary'
                    }
                    type="button"
                  >
                    {t('riderDashboard.btnOffline')}
                  </button>
                </div>
              </div>
            </div>

            <div className="card-modern p-8 mb-6">
              <div className="flex items-center space-x-6 mb-6">
                {rider.profilePhotoUrl && (
                  <img
                    src={rider.profilePhotoUrl}
                    alt={`${rider.firstName} ${rider.lastName}`}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-slate-200"
                  />
                )}
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    {rider.firstName} {rider.lastName}
                  </h2>
                  <p className="text-slate-600">{rider.phone}</p>
                  <p className="text-slate-600">{rider.address}</p>
                </div>
              </div>
            </div>

            <div className="card-modern p-8 mb-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">{t('riderDashboard.editProfileTitle')}</h3>

              {profileError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
                  {profileError}
                </div>
              )}
              {profileSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4">
                  {profileSuccess}
                </div>
              )}

              <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-md">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="label-modern">{t('riderDashboard.firstName')}</label>
                    <input
                      type="text"
                      value={profileForm.firstName}
                      onChange={(e) =>
                        setProfileForm((prev) => ({ ...prev, firstName: e.target.value }))
                      }
                      required
                      className="input-modern"
                    />
                  </div>
                  <div>
                    <label className="label-modern">{t('riderDashboard.lastName')}</label>
                    <input
                      type="text"
                      value={profileForm.lastName}
                      onChange={(e) =>
                        setProfileForm((prev) => ({ ...prev, lastName: e.target.value }))
                      }
                      required
                      className="input-modern"
                    />
                  </div>
                </div>

                <div>
                  <label className="label-modern">{t('riderDashboard.newPhoto')}</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfileFileChange}
                    className="input-modern"
                  />
                </div>

                <button type="submit" className="btn-primary">
                  {t('riderDashboard.updateProfile')}
                </button>
              </form>
            </div>

            <div className="card-modern p-8 mb-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">{t('riderDashboard.editPhoneTitle')}</h3>

              {phoneError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
                  {phoneError}
                </div>
              )}
              {phoneSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4">
                  {phoneSuccess}
                </div>
              )}

              <form onSubmit={handlePhoneSubmit} className="space-y-4 max-w-md">
                <div>
                  <label className="label-modern">{t('riderDashboard.phoneLabel')}</label>
                  <input
                    type="tel"
                    value={phoneForm.phone}
                    onChange={(e) => setPhoneForm({ phone: e.target.value })}
                    required
                    autoComplete="tel"
                    className="input-modern"
                  />
                </div>

                <button type="submit" className="btn-primary">
                  {t('riderDashboard.updatePhone')}
                </button>
              </form>
            </div>

            <div className="card-modern p-8">
              <h3 className="text-lg font-bold text-slate-900 mb-4">{t('riderDashboard.editPasswordTitle')}</h3>

        {passwordError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
            {passwordError}
          </div>
        )}
        {passwordSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4">
            {passwordSuccess}
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          <div>
            <label className="label-modern">{t('riderDashboard.oldPassword')}</label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
              }
              required
              className="input-modern"
            />
          </div>
          <div>
            <label className="label-modern">{t('riderDashboard.newPassword')}</label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, newPassword: e.target.value })
              }
              required
              className="input-modern"
            />
          </div>
          <div>
            <label className="label-modern">{t('riderDashboard.confirmNewPassword')}</label>
            <input
              type="password"
              value={passwordForm.confirmNewPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, confirmNewPassword: e.target.value })
              }
              required
              className="input-modern"
            />
          </div>
          <button
            type="submit"
            className="btn-primary"
          >
            {t('riderDashboard.updatePassword')}
          </button>
        </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RiderDashboardPage;


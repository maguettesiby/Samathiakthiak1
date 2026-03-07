import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Printer } from 'lucide-react';
import { mockApi } from '../services/mockDb';
import { Order } from '../types';

const InvoicePage: React.FC = () => {
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const run = async () => {
      if (!id) return;
      setLoading(true);
      setError('');
      try {
        const data = await (mockApi as any).getOrder(id);
        if (!data) {
          setError('Commande introuvable.');
          setOrder(null);
          return;
        }
        setOrder(data as Order);
      } catch {
        setError('Erreur lors du chargement de la facture.');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [id]);

  const invoiceNumber = useMemo(() => {
    if (!order) return '';
    return `INV-${order.id.replace('ord_', '').slice(0, 12).toUpperCase()}`;
  }, [order]);

  if (loading) {
    return (
      <div className="page-shell flex items-center justify-center">
        <div className="text-slate-700">Chargement...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="page-shell py-10 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="card-modern p-6">
            <p className="text-slate-900 font-bold">{error || 'Facture introuvable'}</p>
            <div className="mt-4">
              <Link to="/new-order" className="btn-primary inline-flex items-center gap-2">
                Créer une commande
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="container mx-auto max-w-3xl">
        {/* Barre actions (non imprimée) */}
        <div className="print:hidden flex items-center justify-between mb-6">
          <Link to={`/orders/${order.id}`} className="btn-secondary inline-flex items-center gap-2">
            <ArrowRight size={18} className="rotate-180" />
            Retour au suivi
          </Link>

          <button type="button" onClick={() => window.print()} className="btn-primary inline-flex items-center gap-2">
            <Printer size={18} />
            Imprimer / Enregistrer en PDF
          </button>
        </div>

        {/* Facture */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-200">
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="flex items-center gap-3">
                  <img
                    src="/images/samathiakthiak-logo.svg"
                    alt="SamaThiakThiak"
                    className="h-10 w-10 rounded-xl border border-slate-200 bg-white"
                    onError={(e: any) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/images/site.png';
                    }}
                  />
                  <div>
                    <p className="text-slate-900 font-black text-lg">SamaThiakThiak</p>
                    <p className="text-slate-600 text-sm">Facture de service</p>
                  </div>
                </div>

                <div className="mt-4 text-sm text-slate-600">
                  <p><span className="font-semibold text-slate-900">Client:</span> {order.customerName}</p>
                  <p><span className="font-semibold text-slate-900">Téléphone:</span> {order.customerPhone}</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-slate-900 font-black text-xl">FACTURE</p>
                <p className="text-slate-600 text-sm mt-1">N° {invoiceNumber}</p>
                <p className="text-slate-600 text-sm">Date: {new Date(order.createdAt).toLocaleDateString('fr-FR')}</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                <p className="text-slate-900 font-bold">Détails</p>
                <div className="mt-3 text-sm text-slate-700 space-y-1">
                  <p><span className="font-semibold">Catégorie:</span> {order.category}</p>
                  <p><span className="font-semibold">Statut:</span> {order.status}</p>
                  {order.scheduledAt ? (
                    <p><span className="font-semibold">Planifiée:</span> {new Date(order.scheduledAt).toLocaleString('fr-FR')}</p>
                  ) : null}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                <p className="text-slate-900 font-bold">Montant</p>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm text-slate-700">
                    <span>Estimation</span>
                    <span className="font-semibold">{order.estimatedPrice} F</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-700 mt-2">
                    <span>Frais</span>
                    <span className="font-semibold">0 F</span>
                  </div>
                  <div className="h-px bg-slate-200 my-4"></div>
                  <div className="flex items-center justify-between text-slate-900">
                    <span className="font-black">Total</span>
                    <span className="font-black text-xl">{order.estimatedPrice} F</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="border border-slate-200 rounded-2xl p-5">
                <p className="text-slate-900 font-bold">Départ ({order.pickupRegion})</p>
                <p className="text-slate-600 text-sm mt-2">{order.pickupAddress}</p>
              </div>
              <div className="border border-slate-200 rounded-2xl p-5">
                <p className="text-slate-900 font-bold">Destination ({order.dropoffRegion})</p>
                <p className="text-slate-600 text-sm mt-2">{order.dropoffAddress}</p>
              </div>
            </div>

            {order.notes ? (
              <div className="mt-6 border border-slate-200 rounded-2xl p-5">
                <p className="text-slate-900 font-bold">Notes</p>
                <p className="text-slate-600 text-sm mt-2">{order.notes}</p>
              </div>
            ) : null}

            <div className="mt-8 text-xs text-slate-500">
              <p>Cette facture est générée automatiquement par SamaThiakThiak. Conserve-la pour ton suivi.</p>
              <p className="mt-1">Paiement: PayTech SN (si applicable selon le service).</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePage;

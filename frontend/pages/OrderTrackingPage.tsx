import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, CheckCircle, Clock, FileText, MapPin, Package, RefreshCw, XCircle } from 'lucide-react';
import { mockApi } from '../services/mockDb';
import { Order, OrderStatus } from '../types';

const statusSteps: { status: OrderStatus; label: string }[] = [
  { status: OrderStatus.CREATED, label: 'Créée' },
  { status: OrderStatus.ASSIGNED, label: 'Assignée' },
  { status: OrderStatus.EN_ROUTE, label: 'En route' },
  { status: OrderStatus.ARRIVED, label: 'Arrivé' },
  { status: OrderStatus.DELIVERED, label: 'Livré' },
];

const OrderTrackingPage: React.FC = () => {
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  const currentIndex = useMemo(() => {
    if (!order) return 0;
    const idx = statusSteps.findIndex((s) => s.status === order.status);
    return idx >= 0 ? idx : 0;
  }, [order]);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const data = await (mockApi as any).getOrder(id);
      if (!data) {
        setError("Commande introuvable.");
        setOrder(null);
        return;
      }
      setOrder(data as Order);
    } catch {
      setError('Erreur lors du chargement de la commande.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const advanceStatus = async () => {
    if (!order) return;

    const next = statusSteps[currentIndex + 1]?.status;
    if (!next) return;

    setUpdating(true);
    try {
      const updated = await (mockApi as any).updateOrderStatus(order.id, next);
      if (updated) {
        setOrder(updated as Order);
      }
    } finally {
      setUpdating(false);
    }
  };

  const cancelOrder = async () => {
    if (!order) return;
    setUpdating(true);
    try {
      const updated = await (mockApi as any).updateOrderStatus(order.id, OrderStatus.CANCELLED);
      if (updated) {
        setOrder(updated as Order);
      }
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="page-shell flex items-center justify-center">
        <div className="text-slate-700">Chargement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-shell py-10 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="card-modern p-6">
            <p className="text-slate-900 font-bold">{error}</p>
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

  if (!order) return null;

  const isCancelled = order.status === OrderStatus.CANCELLED;
  const isDelivered = order.status === OrderStatus.DELIVERED;

  return (
    <div className="page-shell py-8 sm:py-12 px-4">
      <div className="container mx-auto max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">Suivi de commande</h1>
          <p className="text-slate-600">Référence: <span className="font-mono text-slate-900">{order.id}</span></p>
        </div>

        <div className="card-modern p-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <Package className="w-5 h-5 text-blue-600" />
                {order.category}
              </div>
              <p className="text-slate-600 text-sm mt-1">Créée le {new Date(order.createdAt).toLocaleString('fr-FR')}</p>
              {order.scheduledAt && (
                <p className="text-slate-600 text-sm mt-1 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Planifiée: {new Date(order.scheduledAt).toLocaleString('fr-FR')}
                </p>
              )}
            </div>

            <div className="text-right flex-shrink-0">
              <p className="text-slate-900 text-2xl font-black">{order.estimatedPrice}F</p>
              <p className="text-slate-500 text-xs">Estimation</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <p className="text-slate-900 font-bold flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" /> Départ
              </p>
              <p className="text-slate-700 text-sm mt-1">{order.pickupRegion}</p>
              <p className="text-slate-600 text-sm mt-1">{order.pickupAddress}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <p className="text-slate-900 font-bold flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" /> Destination
              </p>
              <p className="text-slate-700 text-sm mt-1">{order.dropoffRegion}</p>
              <p className="text-slate-600 text-sm mt-1">{order.dropoffAddress}</p>
            </div>
          </div>

          {order.notes && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <p className="text-blue-900 font-bold">Notes</p>
              <p className="text-blue-900 text-sm mt-1">{order.notes}</p>
            </div>
          )}
        </div>

        <div className="card-modern p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Statut</h2>

          {isCancelled ? (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 font-bold flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              Commande annulée
            </div>
          ) : isDelivered ? (
            <div className="p-4 rounded-2xl bg-green-50 border border-green-200 text-green-800 font-bold flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Commande livrée
            </div>
          ) : null}

          {!isCancelled && (
            <div className="mt-5 space-y-3">
              {statusSteps.map((s, idx) => {
                const done = idx <= currentIndex;
                return (
                  <div key={s.status} className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                        done ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-500'
                      }`}
                    >
                      {done ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <p className={`font-bold ${done ? 'text-slate-900' : 'text-slate-600'}`}>{s.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={load}
              className="btn-secondary flex items-center justify-center gap-2"
              disabled={updating}
            >
              <RefreshCw className={`w-4 h-4 ${updating ? 'animate-spin' : ''}`} />
              Actualiser
            </button>

            <button
              type="button"
              onClick={advanceStatus}
              className="btn-primary flex items-center justify-center gap-2"
              disabled={updating || isCancelled || isDelivered || currentIndex >= statusSteps.length - 1}
              title="Simulation: avancer le statut"
            >
              Avancer le statut
              <ArrowRight size={18} />
            </button>
          </div>

          <div className="mt-3">
            <Link
              to={`/invoice/${order.id}`}
              target="_blank"
              rel="noreferrer"
              className="w-full btn-secondary flex items-center justify-center gap-2"
              title="Ouvrir la facture imprimable"
            >
              <FileText className="w-4 h-4" />
              Facture (PDF)
            </Link>
          </div>

          {!isCancelled && !isDelivered && (
            <button
              type="button"
              onClick={cancelOrder}
              className="mt-3 w-full btn-secondary"
              disabled={updating}
            >
              Annuler la commande
            </button>
          )}

          <p className="text-xs text-slate-600 mt-4">
            Note: le tracking est en mode simple (sans GPS). Le bouton "Avancer le statut" simule la progression.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingPage;

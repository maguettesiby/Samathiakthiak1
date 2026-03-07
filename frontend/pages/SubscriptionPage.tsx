import React, { useState, useEffect } from 'react';
import { RefreshCw, Clock, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Transaction {
  id: number;
  amount: number;
  type: 'credit' | 'debit' | 'renewal' | 'refund';
  description: string;
  date: string;
}

interface Renewal {
  id: number;
  renewalDate: string;
  amount: number;
  status: 'pending' | 'success' | 'failed' | 'insufficient_balance';
  errorMessage?: string;
  date: string;
}

interface SubscriptionData {
  balance: number;
  autoRenewal: boolean;
  subscriptionExpiresAt?: string;
}

const SubscriptionPage: React.FC = () => {
  const { t } = useTranslation();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [renewals, setRenewals] = useState<Renewal[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSubscriptionData();
    loadTransactions();
    loadRenewals();
  }, []);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const loadSubscriptionData = async () => {
    try {
      const response = await fetch('/api/subscription/balance', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSubscriptionData(data);
      }
    } catch (error) {
      console.error('Erreur chargement données abonnement:', error);
    }
  };

  const loadTransactions = async () => {
    try {
      const response = await fetch('/api/subscription/transactions?limit=20', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error('Erreur chargement transactions:', error);
    }
  };

  const loadRenewals = async () => {
    try {
      const response = await fetch('/api/subscription/renewals?limit=10', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setRenewals(data.renewals);
      }
    } catch (error) {
      console.error('Erreur chargement renouvellements:', error);
    } finally {
      setLoading(false);
    }
  };

  const renewSubscription = async () => {
    setPaymentLoading(true);
    try {
      const response = await fetch('/api/subscription/renew', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        showMessage('success', t('subscription.renewSuccess'));
        loadSubscriptionData();
        loadRenewals();
        loadTransactions();
      } else {
        showMessage('error', t('subscription.renewButError'));
      }
    } catch (error) {
      showMessage('error', t('subscription.paymentError'));
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-shell flex items-center justify-center">
        <div className="text-slate-700 text-base">{t('subscription.loading')}</div>
      </div>
    );
  }

  return (
    <div className="page-shell py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">{t('subscription.title')}</h1>
          <p className="text-slate-600">{t('subscription.subtitle')}</p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            {message.text}
          </div>
        )}

        {/* Cartes principales */}
        {/* Actions */}
        <div className="card-modern p-6 mb-8">
          <h3 className="text-lg font-bold text-slate-900 mb-4">{t('subscription.renewTitle')}</h3>
          <button
            onClick={renewSubscription}
            disabled={paymentLoading}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            {paymentLoading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                {t('subscription.paymentProcessing')}
              </>
            ) : (
              <>
                <ArrowRight className="w-5 h-5" />
                {t('subscription.renewNowFree')}
              </>
            )}
          </button>
        </div>

        {/* Historique des renouvellements */}
        <div className="card-modern p-6 mb-8">
          <h3 className="text-lg font-bold text-slate-900 mb-4">{t('subscription.renewHistory')}</h3>
          {renewals.length === 0 ? (
            <p className="text-slate-600 text-center py-8">{t('subscription.noRenewals')}</p>
          ) : (
            <div className="space-y-3">
              {renewals.map((renewal) => (
                <div key={renewal.id} className="bg-slate-50 rounded-xl p-4 flex items-center justify-between border border-slate-200">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="text-slate-900 font-semibold">{renewal.amount}F</div>
                      <div className="text-slate-600 text-sm">
                        {new Date(renewal.date).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    renewal.status === 'success' ? 'text-green-600 bg-green-100' :
                    renewal.status === 'failed' ? 'text-red-600 bg-red-100' :
                    renewal.status === 'insufficient_balance' ? 'text-orange-600 bg-orange-100' :
                    'text-gray-600 bg-gray-100'
                  }`}>
                    {renewal.status === 'success' ? t('subscription.statusSuccess') : 
                     renewal.status === 'failed' ? t('subscription.statusFailed') :
                     renewal.status === 'insufficient_balance' ? t('subscription.statusInsufficient') : t('subscription.statusPending')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Historique des transactions */}
        <div className="card-modern p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">{t('subscription.transactionsTitle')}</h3>
          {transactions.length === 0 ? (
            <p className="text-slate-600 text-center py-8">{t('subscription.noTransactions')}</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="bg-slate-50 rounded-xl p-4 flex items-center justify-between border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${
                      transaction.type === 'credit' ? 'bg-green-600' :
                      transaction.type === 'debit' ? 'bg-red-600' :
                      transaction.type === 'renewal' ? 'bg-blue-600' :
                      'bg-gray-600'
                    }`}></div>
                    <div>
                      <div className="text-slate-900 font-semibold">
                        {transaction.amount > 0 ? '+' : ''}{transaction.amount}F
                      </div>
                      <div className="text-slate-600 text-sm">{transaction.description}</div>
                      <div className="text-slate-500 text-xs">
                        {new Date(transaction.date).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default SubscriptionPage;

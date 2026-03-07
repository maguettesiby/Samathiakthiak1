import React from 'react';

const RiderCardSkeleton: React.FC = () => {
  return (
    <div className="card-modern h-full flex flex-col">
      <div className="p-5 pb-0 flex items-center justify-between gap-3">
        <div className="w-9 h-9 rounded-xl bg-slate-200 animate-pulse" />
        <div className="h-7 w-28 rounded-full bg-slate-200 animate-pulse" />
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-200 animate-pulse" />
          <div className="flex-1 min-w-0">
            <div className="h-5 w-40 bg-slate-200 rounded-lg animate-pulse" />
            <div className="mt-3 h-4 w-28 bg-slate-200 rounded-lg animate-pulse" />
          </div>
        </div>

        <div className="h-12 rounded-xl bg-slate-200 animate-pulse mb-4" />

        <div className="space-y-3 mb-6">
          <div className="h-4 w-full bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-4 w-2/3 bg-slate-200 rounded-lg animate-pulse" />
        </div>

        <div className="h-12 rounded-xl bg-slate-200 animate-pulse mb-6" />

        <div className="mt-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="h-11 rounded-xl bg-slate-200 animate-pulse" />
          <div className="h-11 rounded-xl bg-slate-200 animate-pulse" />
          <div className="h-11 rounded-xl bg-slate-200 animate-pulse sm:col-span-2" />
        </div>
      </div>

      <div className="px-5 py-3 border-t border-slate-200 flex items-center justify-between">
        <div className="h-4 w-32 bg-slate-200 rounded-lg animate-pulse" />
        <div className="h-4 w-20 bg-slate-200 rounded-lg animate-pulse" />
      </div>
    </div>
  );
};

export default RiderCardSkeleton;

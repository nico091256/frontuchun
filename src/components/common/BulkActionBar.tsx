'use client';

import React from 'react';
import { CheckCircle2, FileSpreadsheet, Printer, X, Loader2 } from 'lucide-react';

interface BulkActionBarProps {
  selectedCount: number;
  totalCount?: number;
  onClear: () => void;
  onSelectAll?: () => void;
  isAllSelected?: boolean;
  onBulkApprove?: () => void;
  onExportExcel?: () => void;
  onExportPDF?: () => void;
  approveLoading?: boolean;
  approveLabel?: string;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  totalCount,
  onClear,
  onSelectAll,
  isAllSelected,
  onBulkApprove,
  onExportExcel,
  onExportPDF,
  approveLoading = false,
  approveLabel = "Barchasini tasdiqlash",
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-bounce-in max-w-xl w-[calc(100%-2rem)]">
      <div className="glass-card p-3 sm:p-4 rounded-2xl shadow-2xl border border-violet-500/30 bg-slate-900/90 dark:bg-slate-900/95 backdrop-blur-xl text-white flex flex-wrap items-center justify-between gap-3">
        {/* Count & Select All */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-violet-500/20 border border-violet-500/40 flex items-center justify-center text-violet-400 font-bold text-xs shrink-0">
            {selectedCount}
          </div>
          <div>
            <p className="text-xs sm:text-sm font-semibold text-white flex items-center gap-1.5">
              <span>{selectedCount} ta tanlandi</span>
              {totalCount !== undefined && totalCount > 0 && (
                <span className="text-slate-400 text-xs font-normal">({totalCount} tadan)</span>
              )}
            </p>
            {onSelectAll && totalCount !== undefined && totalCount > 0 && (
              <button
                type="button"
                onClick={onSelectAll}
                className="text-[11px] text-violet-400 hover:underline font-medium"
              >
                {isAllSelected ? 'Tanlovni bekor qilish' : 'Barchasini tanlash'}
              </button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-auto">
          {onBulkApprove && (
            <button
              type="button"
              onClick={onBulkApprove}
              disabled={approveLoading}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
            >
              {approveLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <CheckCircle2 size={14} />
              )}
              <span>{approveLabel}</span>
            </button>
          )}

          {onExportExcel && (
            <button
              type="button"
              onClick={onExportExcel}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 flex items-center gap-1.5 transition-all"
              title="Excel (CSV) ga yuklash"
            >
              <FileSpreadsheet size={14} />
              <span className="hidden sm:inline">Excel</span>
            </button>
          )}

          {onExportPDF && (
            <button
              type="button"
              onClick={onExportPDF}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/30 text-violet-300 flex items-center gap-1.5 transition-all"
              title="PDF/Chop etish"
            >
              <Printer size={14} />
              <span className="hidden sm:inline">PDF</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClear}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Tozalash"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

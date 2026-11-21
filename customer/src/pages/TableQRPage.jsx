import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMenu } from '../context/MenuContext';
import { getTableDetails } from '../services/api';
import { Utensils, AlertCircle, ArrowRight, Phone, RotateCcw } from 'lucide-react';

export const TableQRPage = () => {
  const { qrToken } = useParams();
  const navigate = useNavigate();
  const { setCurrentTable, setTableSessionToken, restaurant } = useMenu();

  const [validating, setValidating] = useState(true);
  const [error, setError] = useState(null);

  const validateToken = useCallback(async () => {
    try {
      setValidating(true);
      setError(null);
      const table = await getTableDetails(qrToken);
      setCurrentTable(table);
      // Persist table in sessionStorage in case customer refreshes
      sessionStorage.setItem('qissa_active_table', JSON.stringify(table));
      if (table.sessionToken) {
        sessionStorage.setItem('qissa_table_session_token', table.sessionToken);
        setTableSessionToken(table.sessionToken);
      }
      // Redirect to homepage with table active
      navigate('/', { replace: true });
    } catch (err) {
      console.error('QR Validation failed:', err);
      setError(
        err.response?.data?.message ||
          'Connection to server timed out or table code is invalid. Tap retry below.'
      );
    } finally {
      setValidating(false);
    }
  }, [qrToken, setCurrentTable, setTableSessionToken, navigate]);

  useEffect(() => {
    if (qrToken) {
      validateToken();
    }
  }, [qrToken, validateToken]);

  if (validating) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#FAF6F0] text-center">
        <div className="w-16 h-16 rounded-full bg-[#E8602C]/10 border border-[#E8602C]/20 flex items-center justify-center mb-6 animate-pulse">
          <Utensils className="w-8 h-8 text-[#E8602C]" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] mb-2">Connecting to Your Table...</h2>
        <p className="text-sm text-[#6B655D]">Validating QR token and loading digital menu.</p>
        <p className="text-xs text-[#8C8275] mt-2">If cloud server is waking up, this may take a moment...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#FAF6F0] text-center">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-[#F2EBE0] shadow-card">
        <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-[#1A1A1A] mb-2">Table Not Found</h2>
        <p className="text-xs sm:text-sm text-[#6B655D] leading-relaxed mb-6">{error}</p>

        <div className="space-y-3">
          <button
            onClick={validateToken}
            className="w-full py-3 px-4 rounded-full bg-[#E8602C] hover:bg-[#D14E1E] text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retry Connecting to Table</span>
          </button>

          <button
            onClick={() => navigate('/')}
            className="w-full py-3 px-4 rounded-full bg-white hover:bg-neutral-50 text-[#1A1A1A] text-xs font-bold uppercase tracking-wider border border-[#EAE3D6] transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Browse General Menu</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <a
            href={`tel:${restaurant?.phone || '+919876543210'}`}
            className="w-full py-3 px-4 rounded-full bg-[#FAF6F0] hover:bg-[#F2EBE0] text-[#1A1A1A] text-xs font-bold uppercase tracking-wider border border-[#E0D7C9] transition-colors flex items-center justify-center gap-2"
          >
            <Phone className="w-4 h-4 text-[#E8602C]" />
            <span>Call Restaurant Staff</span>
          </a>
        </div>
      </div>
    </div>
  );
};

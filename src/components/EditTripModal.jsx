import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Plane, Building, Lock, Trash2, CheckCircle2 } from 'lucide-react';

const getTodayStr = () => new Date().toISOString().split('T')[0];
const getFutureDateStr = (daysAhead = 5, baseDateStr = null) => {
  const d = baseDateStr ? new Date(baseDateStr) : new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
};

export default function EditTripModal({ isOpen, onClose, activeTrip, onSaveTrip, onDeleteTrip }) {
  const todayStr = getTodayStr();
  const [startDate, setStartDate] = useState(() => {
    if (activeTrip?.startDate && activeTrip.startDate >= todayStr) return activeTrip.startDate;
    return todayStr;
  });
  const [endDate, setEndDate] = useState(() => {
    if (activeTrip?.endDate && activeTrip.endDate >= todayStr) return activeTrip.endDate;
    return getFutureDateStr(5, todayStr);
  });
  const [durationDays, setDurationDays] = useState(activeTrip?.durationDays || 5);
  const [flightNumber, setFlightNumber] = useState(activeTrip?.flightNumber || '');
  const [bookedStayName, setBookedStayName] = useState(activeTrip?.bookedStayName || '');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [dateError, setDateError] = useState('');

  useEffect(() => {
    if (activeTrip) {
      const today = getTodayStr();
      const validStart = (activeTrip.startDate && activeTrip.startDate >= today) ? activeTrip.startDate : today;
      const validEnd = (activeTrip.endDate && activeTrip.endDate >= validStart) ? activeTrip.endDate : getFutureDateStr(5, validStart);
      setStartDate(validStart);
      setEndDate(validEnd);
      setDurationDays(activeTrip.durationDays || 5);
      setFlightNumber(activeTrip.flightNumber || '');
      setBookedStayName(activeTrip.bookedStayName || '');
      setDateError('');
    }
  }, [activeTrip]);

  if (!isOpen || !activeTrip) return null;

  const handleStartDateChange = (val) => {
    const today = getTodayStr();
    let safeStart = val;
    if (safeStart && safeStart < today) {
      safeStart = today;
      setDateError('Start date cannot be in the past. Clamped to today.');
    } else {
      setDateError('');
    }
    setStartDate(safeStart);
    let targetEnd = endDate;
    if (safeStart && endDate && safeStart > endDate) {
      targetEnd = safeStart;
      setEndDate(safeStart);
    }
    if (safeStart && targetEnd) {
      const diff = Math.max(1, Math.ceil((new Date(targetEnd) - new Date(safeStart)) / (1000 * 60 * 60 * 24)));
      setDurationDays(diff);
    }
  };

  const handleEndDateChange = (val) => {
    let safeEnd = val;
    if (safeEnd && startDate && safeEnd < startDate) {
      safeEnd = startDate;
      setDateError('End date cannot be earlier than start date. Clamped to start date.');
    } else {
      setDateError('');
    }
    setEndDate(safeEnd);
    if (startDate && safeEnd) {
      const diff = Math.max(1, Math.ceil((new Date(safeEnd) - new Date(startDate)) / (1000 * 60 * 60 * 24)));
      setDurationDays(diff);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    const today = getTodayStr();
    if (!startDate || startDate < today) {
      setDateError('Start date cannot be in the past. Please select today or a future date.');
      return;
    }
    if (!endDate || endDate < startDate) {
      setDateError('End date cannot be earlier than start date.');
      return;
    }

    const cleanFlight = (flightNumber || '').trim();
    const cleanStay = (bookedStayName || '').trim();

    onSaveTrip(activeTrip.id, {
      startDate,
      endDate,
      durationDays: parseInt(durationDays, 10),
      flightNumber: cleanFlight,
      flightConfirmed: cleanFlight ? (activeTrip?.flightConfirmed ?? true) : false,
      bookedStayName: cleanStay,
      stayConfirmed: cleanStay ? (activeTrip?.stayConfirmed ?? true) : false
      // Note: destinationId remains immutable!
    });
    onClose();
  };

  const handleDelete = () => {
    onDeleteTrip(activeTrip.id);
    setShowConfirmDelete(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-violet-500/10 text-violet-600">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Edit Trip Details</h3>
              <p className="text-xs text-slate-500">Update dates, stay duration, or flight details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!showConfirmDelete ? (
          <form onSubmit={handleSave} className="mt-5 space-y-4">
            {/* Immutable Destination Banner */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Destination (Fixed)</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{activeTrip.destName || activeTrip.destinationId}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-200/60 dark:bg-slate-700 text-slate-500 text-xs font-medium">
                <Lock className="w-3.5 h-3.5" /> Immutable
              </div>
            </div>

            {/* Dates & Duration */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  min={todayStr}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || todayStr}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">Duration (Days)</label>
              <div className="relative">
                <Clock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                />
              </div>
            </div>

            {/* Flight Number */}
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">Flight Number</label>
              <div className="relative">
                <Plane className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={flightNumber}
                  onChange={(e) => setFlightNumber(e.target.value)}
                  placeholder="e.g. BA 116, AF 023, or leave blank"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                />
              </div>
            </div>

            {/* Stay Name */}
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">Booked Accommodation</label>
              <div className="relative">
                <Building className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={bookedStayName}
                  onChange={(e) => setBookedStayName(e.target.value)}
                  placeholder="e.g. Hotel / Hostel name, or leave blank"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                />
              </div>
            </div>

            {dateError && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
                <span>⚠️ {dateError}</span>
              </div>
            )}

            {/* Actions */}
            <div className="pt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowConfirmDelete(true)}
                className="px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Delete Trip
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-md shadow-violet-500/20 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* Confirmation Dialog for Delete */
          <div className="mt-5 text-center space-y-4 py-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Delete Trip to {activeTrip.destName || activeTrip.destinationId}?</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                This will purge all associated itinerary days, travel packs, and stay bookings for this trip from database.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/20"
              >
                Yes, Delete Trip
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

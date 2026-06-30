import React, { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AttendanceCalendar = ({ user, attendance, onClose }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const getDayStatus = (day) => {
    const formattedDay = format(day, 'yyyy-MM-dd');
    const records = attendance.filter(a => a.date === formattedDay);
    if (records.length > 0) {
      return records.some(r => r.status === 'present') ? 'present' : 'absent';
    }
    // If it's a future date or today (and no record), it might be "unknown"
    return null;
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-zinc-900 border border-white/10 w-full max-w-2xl rounded-[2rem] p-8 relative shadow-2xl overflow-hidden glass-card"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-500 hover:text-white transition-all bg-white/5 hover:bg-white/10 p-2 rounded-full"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/20">
            <CalendarIcon className="text-white w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">
              {user.name} <span className="text-red-600">Davomat Kalendari</span>
            </h3>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">{format(currentMonth, 'MMMM yyyy')}</p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-all">
            <ChevronLeft size={20} />
          </button>
          <span className="text-lg font-bold text-white uppercase tracking-widest italic">{format(currentMonth, 'MMMM yyyy')}</span>
          <button onClick={nextMonth} className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-all">
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sha', 'Yak'].map(day => (
            <div key={day} className="text-center text-[10px] font-black text-gray-500 uppercase tracking-widest pb-2">
              {day}
            </div>
          ))}
          {days.map((day, idx) => {
            const status = getDayStatus(day);
            const isTodayDate = isToday(day);
            return (
              <div 
                key={idx} 
                className={`
                  aspect-square rounded-xl flex flex-col items-center justify-center relative border transition-all
                  ${status === 'present' ? 'bg-green-600/20 border-green-500/30 text-green-500' : 
                    status === 'absent' ? 'bg-red-600/20 border-red-500/30 text-red-500' : 
                    'bg-white/[0.02] border-white/5 text-gray-500'}
                  ${isTodayDate ? 'ring-2 ring-red-600 ring-offset-2 ring-offset-zinc-900 border-red-600/50' : ''}
                  hover:scale-105
                `}
              >
                <span className="text-xs font-bold">{format(day, 'd')}</span>
                {status === 'present' && <CheckCircle size={10} className="mt-1" />}
                {status === 'absent' && <XCircle size={10} className="mt-1" />}
              </div>
            );
          })}
        </div>

        <div className="flex gap-6 mt-8 p-4 bg-white/[0.02] rounded-2xl border border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Kelgan</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Kelmadi</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AttendanceCalendar;

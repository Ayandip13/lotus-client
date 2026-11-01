import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Phone, Mail, User, ShieldCheck, Eye, Edit3, Trash2 } from 'lucide-react';
import { BookingEvent } from '../types/booking.types';
import { Card, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

interface BookingCardProps {
  booking: BookingEvent;
  onDeleteClick: (booking: BookingEvent) => void;
}

export const BookingCard: React.FC<BookingCardProps> = ({ booking, onDeleteClick }) => {
  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Card className="hover:border-slate-300 transition-colors">
      <CardContent className="p-4 space-y-3">
        {/* Top Header: Title & Creator Badge */}
        <div className="flex items-start justify-between gap-2">
          <Link
            to={`/bookings/${booking._id}`}
            className="font-semibold text-slate-900 hover:text-slate-700 text-sm leading-snug"
          >
            {booking.title}
          </Link>
          <Badge variant="neutral" className="shrink-0 text-[10px] gap-1 py-0.5">
            <ShieldCheck className="w-2.5 h-2.5 text-slate-400" />
            <span>{booking.createdByPartner?.name || 'Partner'}</span>
          </Badge>
        </div>

        {/* Date */}
        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{formatDate(booking.eventDate)}</span>
        </div>

        {/* Details preview */}
        {booking.eventDetails && (
          <p className="text-xs text-slate-500 line-clamp-2 bg-slate-50 p-2 rounded-md">
            {booking.eventDetails}
          </p>
        )}

        {/* Guest Information */}
        <div className="pt-1 border-t border-slate-100 space-y-1 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-slate-800">
            <User className="w-3 h-3 text-slate-400 shrink-0" />
            <span>{booking.guestName}</span>
          </div>

          <div className="flex items-center justify-between text-slate-500">
            <div className="flex items-center gap-1.5">
              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
              <a href={`tel:${booking.guestPhone}`} className="hover:underline">
                {booking.guestPhone}
              </a>
            </div>

            {booking.guestEmail && (
              <div className="flex items-center gap-1.5 truncate max-w-[140px]">
                <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{booking.guestEmail}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Row */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
          <Link to={`/bookings/${booking._id}`} className="flex-1 sm:flex-none">
            <Button variant="outline" size="sm" className="w-full text-xs h-8 gap-1">
              <Eye className="w-3.5 h-3.5" />
              <span>Details</span>
            </Button>
          </Link>

          <Link to={`/bookings/${booking._id}/edit`}>
            <Button variant="secondary" size="sm" className="text-xs h-8 px-2.5">
              <Edit3 className="w-3.5 h-3.5" />
              <span className="sr-only">Edit</span>
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDeleteClick(booking)}
            className="text-xs h-8 px-2.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

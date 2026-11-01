import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, Edit3, Trash2, Calendar, Phone, Mail, User, ShieldCheck } from 'lucide-react';
import { BookingEvent } from '../types/booking.types';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmptyState,
} from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';

interface BookingTableProps {
  bookings: BookingEvent[];
  onDeleteClick: (booking: BookingEvent) => void;
}

export const BookingTable: React.FC<BookingTableProps> = ({ bookings, onDeleteClick }) => {
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[30%]">Event / Booking</TableHead>
          <TableHead className="w-[18%]">Event Date</TableHead>
          <TableHead className="w-[27%]">Guest & Contact</TableHead>
          <TableHead className="w-[13%]">Created By</TableHead>
          <TableHead className="w-[12%] text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings.length === 0 ? (
          <TableEmptyState message="No catering bookings or events found." colSpan={5} />
        ) : (
          bookings.map((booking) => (
            <TableRow key={booking._id} className="group">
              {/* 1. Title & Details */}
              <TableCell>
                <div>
                  <Link
                    to={`/bookings/${booking._id}`}
                    className="font-semibold text-slate-900 hover:text-slate-700 transition-colors inline-block"
                  >
                    {booking.title}
                  </Link>
                  {booking.eventDetails && (
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5 max-w-sm">
                      {booking.eventDetails}
                    </p>
                  )}
                </div>
              </TableCell>

              {/* 2. Event Date */}
              <TableCell>
                <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{formatDate(booking.eventDate)}</span>
                </div>
              </TableCell>

              {/* 3. Guest / Client */}
              <TableCell>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-900">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{booking.guestName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                    <a
                      href={`tel:${booking.guestPhone}`}
                      className="hover:underline hover:text-slate-700"
                    >
                      {booking.guestPhone}
                    </a>
                  </div>
                  {booking.guestEmail && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[180px]">{booking.guestEmail}</span>
                    </div>
                  )}
                </div>
              </TableCell>

              {/* 4. Created by Partner */}
              <TableCell>
                <Badge variant="neutral" className="gap-1 font-normal text-[11px] py-0.5">
                  <ShieldCheck className="w-3 h-3 text-slate-400" />
                  <span>{booking.createdByPartner?.name || 'Partner'}</span>
                </Badge>
              </TableCell>

              {/* 5. Actions */}
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Link
                    to={`/bookings/${booking._id}`}
                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                    title="View Booking Details"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="sr-only">View</span>
                  </Link>

                  <Link
                    to={`/bookings/${booking._id}/edit`}
                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                    title="Edit Booking"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span className="sr-only">Edit</span>
                  </Link>

                  <button
                    onClick={() => onDeleteClick(booking)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    title="Delete Booking"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="sr-only">Delete</span>
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

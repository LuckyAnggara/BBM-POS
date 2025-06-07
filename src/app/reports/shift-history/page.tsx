
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarIcon, Filter, Loader2, UserCircle, ClipboardList } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { format, parseISO, isValid, startOfDay, endOfDay, subDays } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import type { PosSession, User as AppUser, PosSessionStatus } from '@/lib/types';
import { fetchShiftHistory, type FetchShiftHistoryFilters } from '../actions';
import { cn } from '@/lib/utils';
import { usePageTitle } from '@/components/layout/page-title-context';
import { Badge } from '@/components/ui/badge';
// Assuming fetchUsers might be added later for a user filter dropdown
// import { fetchUsers } from '@/app/admin/users/actions';

const posSessionStatusColors: Record<PosSessionStatus, string> = {
    OPEN: 'bg-green-100 text-green-800 border border-green-300',
    CLOSED: 'bg-gray-200 text-gray-700 border border-gray-300',
    // Add other statuses if they exist in your enum
};


export default function ShiftHistoryPage() {
  usePageTitle('Shift History Report');
  const [shifts, setShifts] = useState<PosSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FetchShiftHistoryFilters>({
    startDate: format(subDays(new Date(), 7), 'yyyy-MM-dd'), // Default to last 7 days
    endDate: format(new Date(), 'yyyy-MM-dd'),
    userId: 'all', // Placeholder for future user filter
  });
  // const [usersForFilter, setUsersForFilter] = useState<AppUser[]>([]); // For user filter dropdown

  const loadShiftData = useCallback(async (currentFilters: FetchShiftHistoryFilters) => {
    setIsLoading(true);
    try {
      const fetchedShifts = await fetchShiftHistory(currentFilters);
      setShifts(fetchedShifts);
    } catch (error) {
      toast.error("Failed to load shift history.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShiftData(filters);
    // Example for loading users for a filter (if you implement user filtering)
    // async function loadUsersForFilter() {
    //   try {
    //     const u = await fetchUsers(); 
    //     setUsersForFilter(u);
    //   } catch (e) { toast.error("Could not load users for filter"); }
    // }
    // loadUsersForFilter();
  }, [loadShiftData, filters]);

  const handleDateChange = (dateRange: { from?: Date; to?: Date; } | undefined) => {
    setFilters(prev => ({
      ...prev,
      startDate: dateRange?.from ? format(startOfDay(dateRange.from), 'yyyy-MM-dd') : undefined,
      endDate: dateRange?.to ? format(endOfDay(dateRange.to), 'yyyy-MM-dd') : undefined,
    }));
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <ClipboardList className="h-6 w-6 text-primary" /> Shift Sessions Log
          </CardTitle>
          <CardDescription>Review past and current Point of Sale sessions, including cash reconciliation.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 items-center mb-4 print:hidden">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="dateRangeFilter"
                  variant={"outline"}
                  className={cn(
                    "w-full sm:w-auto min-w-[280px] justify-start text-left font-normal",
                    !filters.startDate && !filters.endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.startDate && filters.endDate
                    ? `${isValid(parseISO(filters.startDate)) ? format(parseISO(filters.startDate), "LLL dd, y") : ""} - ${isValid(parseISO(filters.endDate)) ? format(parseISO(filters.endDate), "LLL dd, y") : ""}`
                    : filters.startDate && isValid(parseISO(filters.startDate))
                    ? `From ${format(parseISO(filters.startDate), "LLL dd, y")}`
                    : filters.endDate && isValid(parseISO(filters.endDate))
                    ? `To ${format(parseISO(filters.endDate), "LLL dd, y")}`
                    : <span>Date Range</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={filters.startDate && isValid(parseISO(filters.startDate)) ? parseISO(filters.startDate) : new Date()}
                  selected={{
                    from: filters.startDate && isValid(parseISO(filters.startDate)) ? parseISO(filters.startDate) : undefined,
                    to: filters.endDate && isValid(parseISO(filters.endDate)) ? parseISO(filters.endDate) : undefined,
                  }}
                  onSelect={handleDateChange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            {/* Placeholder for User Filter Dropdown */}
            {/* <Select>...</Select> */}
            <Button onClick={() => loadShiftData(filters)} disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Filter className="mr-2 h-4 w-4" />}
              Apply Filters
            </Button>
          </div>

          {isLoading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  {[...Array(8)].map((_, i) => <TableHead key={i}><Skeleton className="h-5 w-full my-1" /></TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(8)].map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full my-1" /></TableCell>)}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : shifts.length === 0 ? (
            <div className="text-center text-muted-foreground py-10">
                <ClipboardList className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No shift history found for the selected criteria.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead className="text-right">Start Cash</TableHead>
                  <TableHead className="text-right">Expected</TableHead>
                  <TableHead className="text-right">Counted</TableHead>
                  <TableHead className="text-right">Difference</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shifts.map((shift) => (
                  <TableRow key={shift.id}>
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-1.5">
                        <UserCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="truncate" title={shift.user?.name || 'N/A'}>{shift.user?.name || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{format(parseISO(shift.startTime), 'MMM dd, HH:mm')}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{shift.endTime ? format(parseISO(shift.endTime), 'MMM dd, HH:mm') : <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/30">Active</Badge>}</TableCell>
                    <TableCell className="text-right text-xs">${shift.startingCash.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-xs">${shift.expectedCashInDrawer.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-xs font-medium">
                      {shift.countedCash !== null ? `$${shift.countedCash.toFixed(2)}` : 'N/A'}
                    </TableCell>
                    <TableCell 
                        className={`text-right text-xs font-semibold ${
                            shift.cashDifference === null || shift.cashDifference === 0 
                                ? 'text-gray-600' 
                                : shift.cashDifference > 0 
                                ? 'text-green-600' 
                                : 'text-red-600'
                        }`}
                    >
                      {shift.cashDifference !== null 
                        ? `${shift.cashDifference > 0 ? '+' : ''}$${shift.cashDifference.toFixed(2)}` 
                        : (shift.status === 'CLOSED' ? '$0.00' : 'N/A')}
                    </TableCell>
                    <TableCell className="text-center text-xs">
                       <Badge
                        variant="outline"
                        className={`text-xs px-2 py-0.5 ${posSessionStatusColors[shift.status] || 'bg-gray-100 text-gray-800 border-gray-300'}`}
                       >
                         {shift.status}
                       </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          </CardContent>
        </Card>
      </div>
    );
  }

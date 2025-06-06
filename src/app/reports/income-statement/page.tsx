
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, FileText, TrendingUp, TrendingDown, DollarSign, FileSpreadsheet } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { fetchIncomeStatementData } from '../actions';
import type { IncomeStatementData } from '@/lib/types';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface StatDisplayProps {
  title: string;
  value: number | null;
  icon: React.ElementType;
  isLoading: boolean;
  currency?: boolean;
  trend?: 'positive' | 'negative' | 'neutral';
}

function StatDisplay({ title, value, icon: Icon, isLoading, currency = true, trend = 'neutral' }: StatDisplayProps) {
  const formattedValue = currency 
    ? value?.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) 
    : value?.toLocaleString();

  const trendColor = trend === 'positive' ? 'text-green-600' : trend === 'negative' ? 'text-red-600' : 'text-muted-foreground';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${isLoading ? 'text-muted-foreground' : trendColor}`} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-3/4" />
        ) : (
          <div className={`text-2xl font-bold font-headline ${trend !== 'neutral' ? trendColor : ''}`}>
            {value !== null ? formattedValue : 'N/A'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


export default function IncomeStatementPage() {
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: subDays(new Date(), 30), // Default to last 30 days
    to: new Date(),
  });
  const [reportData, setReportData] = useState<IncomeStatementData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateReport = async () => {
    if (!dateRange.from || !dateRange.to) {
      toast.error('Please select a valid date range.');
      return;
    }
    setIsLoading(true);
    setReportData(null);
    try {
      const data = await fetchIncomeStatementData(dateRange.from, dateRange.to);
      setReportData(data);
      toast.success('Income Statement generated successfully.');
    } catch (error) {
      toast.error('Failed to generate Income Statement.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-6">
      <Card className="print:shadow-none print:border-none">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Income Statement
          </CardTitle>
          <CardDescription>
            Select a date range to generate the income statement.
            This report reflects completed sales only.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center print:hidden">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full sm:w-[280px] justify-start text-left font-normal",
                    !dateRange.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            <Button onClick={handleGenerateReport} disabled={isLoading || !dateRange.from || !dateRange.to}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Report
            </Button>
             {reportData && (
              <Button variant="outline" onClick={handlePrintReport} className="ml-auto">
                <Printer className="mr-2 h-4 w-4" /> Print
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {reportData && !isLoading && (
        <Card className="print:shadow-none print:border-none">
          <CardHeader>
            <CardTitle className="text-xl font-headline">Report for Period:</CardTitle>
            <CardDescription>
              {format(new Date(reportData.startDate), 'PPP')} - {format(new Date(reportData.endDate), 'PPP')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <StatDisplay title="Total Revenue" value={reportData.revenue} icon={TrendingUp} isLoading={isLoading} trend="positive" />
              <StatDisplay title="Cost of Goods Sold (COGS)" value={reportData.cogs} icon={TrendingDown} isLoading={isLoading} trend="negative"/>
              <StatDisplay title="Gross Profit" value={reportData.grossProfit} icon={DollarSign} isLoading={isLoading} trend={reportData.grossProfit >= 0 ? 'positive' : 'negative'}/>
            </div>
            <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold">Summary</h3>
                <div className="mt-2 space-y-1 text-sm">
                    <div className="flex justify-between">
                        <span>Revenue:</span>
                        <span className="font-medium">{reportData.revenue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Cost of Goods Sold:</span>
                        <span className="font-medium">({reportData.cogs.toLocaleString('en-US', { style: 'currency', currency: 'USD' })})</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                        <span>Gross Profit:</span>
                        <span>{reportData.grossProfit.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                    </div>
                    {/* Future: Operating Expenses can be added here */}
                     <div className="flex justify-between text-muted-foreground">
                        <span>Operating Expenses:</span>
                        <span className="font-medium">($0.00)</span>
                    </div>
                    <div className="flex justify-between font-bold text-base border-t-2 pt-2 mt-2">
                        <span>Net Income:</span>
                        <span className={reportData.netIncome >= 0 ? 'text-green-700' : 'text-red-700'}>{reportData.netIncome.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                    </div>
                </div>
            </div>
             <p className="text-xs text-muted-foreground pt-4 print:hidden">
              Note: This statement is based on completed sales and recorded cost of goods sold. It does not include other operating expenses.
            </p>
          </CardContent>
        </Card>
      )}
       {isLoading && !reportData && (
         <Card>
          <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </CardContent>
         </Card>
      )}

    </div>
  );
}

import React, { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Search,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from './input';
import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from './dropdown-menu';

export interface ColumnDef<T> {
  id: string;
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  hideable?: boolean;
  mobileHidden?: boolean;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  searchKey?: keyof T | ((item: T) => string);
  searchPlaceholder?: string;
  pageSize?: number;
  emptyState?: React.ReactNode;
  onRowClick?: (row: T) => void;
  renderMobileCard?: (row: T) => React.ReactNode;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchKey,
  searchPlaceholder = 'Search records...',
  pageSize = 10,
  emptyState,
  onRowClick,
  renderMobileCard,
  className,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    columns.forEach(col => {
      init[col.id] = true;
    });
    return init;
  });

  // Filter
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();

    return data.filter(item => {
      if (typeof searchKey === 'function') {
        return searchKey(item).toLowerCase().includes(term);
      }
      if (searchKey) {
        const val = item[searchKey];
        return String(val ?? '').toLowerCase().includes(term);
      }
      return Object.values(item).some(val =>
        String(val ?? '').toLowerCase().includes(term)
      );
    });
  }, [data, searchTerm, searchKey]);

  // Sort
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;
    const col = columns.find(c => c.id === sortColumn);
    if (!col) return filteredData;

    return [...filteredData].sort((a, b) => {
      let valA = col.accessorKey ? a[col.accessorKey] : a[col.id];
      let valB = col.accessorKey ? b[col.accessorKey] : b[col.id];

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = String(valB).toLowerCase();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      return sortDirection === 'asc' ? 1 : -1;
    });
  }, [filteredData, sortColumn, sortDirection, columns]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (columnId: string, sortable?: boolean) => {
    if (sortable === false) return;
    if (sortColumn === columnId) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColumn(null);
        setSortDirection('asc');
      }
    } else {
      setSortColumn(columnId);
      setSortDirection('asc');
    }
  };

  const activeColumns = columns.filter(c => visibleColumns[c.id] !== false);

  return (
    <div className={cn('w-full space-y-4', className)}>
      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-72">
          <Input
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={searchPlaceholder}
            leftIcon={<Search className="h-4 w-4" />}
            className="h-9"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Column Visibility Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" leftIcon={<SlidersHorizontal className="h-3.5 w-3.5" />}>
                View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs">Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {columns
                .filter(col => col.hideable !== false)
                .map(col => (
                  <DropdownMenuCheckboxItem
                    key={col.id}
                    checked={visibleColumns[col.id] !== false}
                    onCheckedChange={checked => {
                      setVisibleColumns(prev => ({ ...prev, [col.id]: checked }));
                    }}
                  >
                    {col.header}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Desktop Data Table */}
      <div className="hidden md:block rounded-xl border border-border/80 bg-card overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 border-b border-border text-xs uppercase tracking-wider text-muted-foreground sticky top-0 z-10 backdrop-blur-sm">
              <tr>
                {activeColumns.map(col => {
                  const isSorted = sortColumn === col.id;
                  return (
                    <th
                      key={col.id}
                      onClick={() => handleSort(col.id, col.sortable)}
                      className={cn(
                        'py-3 px-4 font-semibold select-none',
                        col.sortable !== false && 'cursor-pointer hover:text-foreground transition-colors'
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{col.header}</span>
                        {col.sortable !== false && (
                          <span className="text-muted-foreground/60">
                            {isSorted ? (
                              sortDirection === 'asc' ? (
                                <ChevronUp className="h-3.5 w-3.5 text-primary-600" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5 text-primary-600" />
                              )
                            ) : (
                              <ChevronsUpDown className="h-3.5 w-3.5" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={activeColumns.length} className="py-12 text-center text-muted-foreground">
                    {emptyState || 'No records found.'}
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, idx) => (
                  <tr
                    key={row.id || idx}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={cn(
                      'hover:bg-muted/30 transition-colors',
                      onRowClick && 'cursor-pointer'
                    )}
                  >
                    {activeColumns.map(col => (
                      <td key={col.id} className="py-3 px-4 text-foreground align-middle">
                        {col.cell ? col.cell(row) : col.accessorKey ? String(row[col.accessorKey] ?? '') : ''}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card Fallback */}
      <div className="block md:hidden space-y-3">
        {paginatedData.length === 0 ? (
          <div className="rounded-xl border border-border/80 bg-card p-8 text-center text-muted-foreground text-sm">
            {emptyState || 'No records found.'}
          </div>
        ) : (
          paginatedData.map((row, idx) => (
            <div
              key={row.id || idx}
              onClick={() => onRowClick && onRowClick(row)}
              className={cn(
                'rounded-xl border border-border/80 bg-card p-4 shadow-soft space-y-2.5',
                onRowClick && 'cursor-pointer active:bg-muted/40'
              )}
            >
              {renderMobileCard ? (
                renderMobileCard(row)
              ) : (
                <div className="space-y-1.5">
                  {columns.slice(0, 4).map(col => (
                    <div key={col.id} className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground font-medium">{col.header}:</span>
                      <span className="text-foreground font-semibold">
                        {col.cell ? col.cell(row) : col.accessorKey ? String(row[col.accessorKey] ?? '') : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <div>
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} entries
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2 font-medium">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useCallback, useState } from "react";
import FilterItem from "./FilterItem";
import { DatesRangeValue } from "@mantine/dates";
import { GridifyQueryBuilder, ConditionalOperator as op } from "gridify-client";

export default function useFilters(initial: FilterItem[] = []) {
  const [filter, setFilter] = useState<FilterItem[]>(initial);

  const addOrReplaceFilter = useCallback((newFilter: FilterItem) => {
    setFilter((prev) => {
      if (prev.some((f) => f.key === newFilter.key && f.value === newFilter.value)) return prev;
      const existingIndex = prev.findIndex((f) => f.key === newFilter.key);
      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = newFilter;
        return updated;
      } else {
        return [...prev, newFilter];
      }
    });
  }, []);

  const removeFilter = useCallback((key: string) => {
    setFilter((prev) => prev.filter((f) => f.key !== key));
  }, []);

  const getFilterValueOrDefault = useCallback(
    (key: string, defaultValue: string | number | boolean | Date | DatesRangeValue | null) => {
      const filterItem = filter.find((f) => f.key === key);
      return filterItem?.value ?? defaultValue;
    },
    [filter],
  );

  const isFilterActive = useCallback((key: string) => filter.some((f) => f.key === key), [filter]);

  const applyFiltersToQuery = useCallback(
    (query: GridifyQueryBuilder) => {
      if (filter.length > 0) {
        console.log("Applying filters to query:", filter);
        filter.forEach((f) => {
          const val = f.value as any;
          const isDateRange = Array.isArray(val) && val.length === 2;
          if (f.value == null || (isDateRange && val.some((v) => v == null))) return;
          console.log(`Adding filter to query - Key: ${f.key}, Value: ${f.value}`);
          if (query.build().filter != "") {
            console.log("Adding AND operator to query");
            query.and();
          }
          if (isDateRange) {
            const dateRange = val as DatesRangeValue;
            if (dateRange[0] == null || dateRange[1] == null) return;

            const startDate = new Date(new Date(dateRange[0]!).setHours(0, 0, 0, 0)).toISOString();
            const endDate = new Date(new Date(dateRange[1]!).setHours(23, 59, 59, 999)).toISOString();
            query.startGroup();
            query.addCondition(f.key, op.GreaterThanOrEqual, startDate);
            query.and();
            query.addCondition(f.key, op.LessThanOrEqual, endDate);
            query.endGroup();
          } else if (typeof val === "string" || typeof val === "number") {
            query.addCondition(f.key, op.Contains, val.toString(), false);
          } else if (typeof val === "boolean") {
            query.addCondition(f.key, op.Equal, val.toString());
          }
        });
      }
    },
    [filter],
  );

  return { filter, addOrReplaceFilter, removeFilter, getFilterValueOrDefault, isFilterActive, setFilter, applyFiltersToQuery };
}

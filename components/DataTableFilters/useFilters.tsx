import { useCallback, useState } from "react";
import FilterItem, { DatesRangeValue, NumberRangeValue } from "./FilterItem";
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
    (key: string, defaultValue: string | number | boolean | Date | DatesRangeValue | NumberRangeValue | null) => {
      const filterItem = filter.find((f) => f.key === key);
      return filterItem?.value ?? defaultValue;
    },
    [filter],
  );

  const isFilterActive = useCallback((key: string) => filter.some((f) => f.key === key), [filter]);

  const applyFiltersToQuery = useCallback(
    (query: GridifyQueryBuilder) => {
      if (filter.length > 0) {
        filter.forEach((f) => {
          const val = f.value as any;
          const isDateRange = Array.isArray(val) && val.length === 2;
          const isNumberRange = typeof val === "object" && val !== null && "min" in val && "max" in val;
          if (
            f.value == null ||
            (isDateRange && val.some((v) => v == null)) ||
            (isNumberRange && (val.min == null || val.max == null))
          )
            return;

          if (query.build().filter != "") {
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
          } else if (isNumberRange) {
            const numberRange = val as NumberRangeValue;
            query.startGroup();
            query.addCondition(f.key, op.GreaterThanOrEqual, numberRange.min!.toString());
            query.and();
            query.addCondition(f.key, op.LessThanOrEqual, numberRange.max!.toString());
            query.endGroup();
          } else if (typeof val === "string") {
            query.addCondition(f.key, op.Contains, val.toString(), false);
          } else if (typeof val === "boolean") {
            query.addCondition(f.key, op.Equal, val.toString());
          } else if (typeof val === "number") {
            query.addCondition(f.key, op.Equal, val.toString());
          } else {
            console.warn(`Unsupported filter value type for key: ${f.key}, value: ${f.value}`);
          }
        });
      }
    },
    [filter],
  );

  return { filter, addOrReplaceFilter, removeFilter, getFilterValueOrDefault, isFilterActive, setFilter, applyFiltersToQuery };
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface ProductFiltersProps {
  categories: string[];
  altCategories: string[];
  productTypes: string[];
  supplierCountries: string[];
  onFilterChange: (filters: FilterState) => void;
  onReset: () => void;
  translations: {
    title: string;
    reset: string;
    category: string;
    altCategory: string;
    productType: string;
    supplierCountry: string;
  };
}

export interface FilterState {
  selectedCategories: string[];
  selectedAltCategories: string[];
  selectedProductTypes: string[];
  selectedSupplierCountries: string[];
}

export function ProductFilters({ 
  categories, 
  altCategories,
  productTypes,
  supplierCountries,
  onFilterChange,
  onReset,
  translations: t
}: ProductFiltersProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedAltCategories, setSelectedAltCategories] = useState<string[]>([]);
  const [selectedProductTypes, setSelectedProductTypes] = useState<string[]>([]);
  const [selectedSupplierCountries, setSelectedSupplierCountries] = useState<string[]>([]);

  const buildFilterState = (): FilterState => ({
    selectedCategories,
    selectedAltCategories,
    selectedProductTypes,
    selectedSupplierCountries,
  });

  const handleCategoryToggle = (category: string) => {
    const updated = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];
    setSelectedCategories(updated);
    onFilterChange({ ...buildFilterState(), selectedCategories: updated });
  };

  const handleAltCategoryToggle = (category: string) => {
    const updated = selectedAltCategories.includes(category)
      ? selectedAltCategories.filter((c) => c !== category)
      : [...selectedAltCategories, category];
    setSelectedAltCategories(updated);
    onFilterChange({ ...buildFilterState(), selectedAltCategories: updated });
  };

  const handleProductTypeToggle = (type: string) => {
    const updated = selectedProductTypes.includes(type)
      ? selectedProductTypes.filter((t) => t !== type)
      : [...selectedProductTypes, type];
    setSelectedProductTypes(updated);
    onFilterChange({ ...buildFilterState(), selectedProductTypes: updated });
  };

  const handleSupplierCountryToggle = (country: string) => {
    const updated = selectedSupplierCountries.includes(country)
      ? selectedSupplierCountries.filter((c) => c !== country)
      : [...selectedSupplierCountries, country];
    setSelectedSupplierCountries(updated);
    onFilterChange({ ...buildFilterState(), selectedSupplierCountries: updated });
  };

  const handleReset = () => {
    setSelectedCategories([]);
    setSelectedAltCategories([]);
    setSelectedProductTypes([]);
    setSelectedSupplierCountries([]);
    onReset();
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t.title}</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="text-xs"
        >
          {t.reset}
        </Button>
      </div>

      {/* Category */}
      {categories.length > 0 && (
        <>
          <div className="space-y-3">
            <h3 className="font-medium text-sm">{t.category}</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {categories.map((category) => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category}`}
                    checked={selectedCategories.includes(category)}
                    onCheckedChange={() => handleCategoryToggle(category)}
                  />
                  <Label
                    htmlFor={`category-${category}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {category}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <Separator />
        </>
      )}

      {/* Alt Kategori */}
      {altCategories.length > 0 && (
        <>
          <div className="space-y-3">
            <h3 className="font-medium text-sm">{t.altCategory}</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {altCategories.map((category) => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={`alt-category-${category}`}
                    checked={selectedAltCategories.includes(category)}
                    onCheckedChange={() => handleAltCategoryToggle(category)}
                  />
                  <Label
                    htmlFor={`alt-category-${category}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {category}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <Separator />
        </>
      )}

      {/* Ürün Tipi */}
      {productTypes.length > 0 && (
        <>
          <div className="space-y-3">
            <h3 className="font-medium text-sm">{t.productType}</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {productTypes.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`product-type-${type}`}
                    checked={selectedProductTypes.includes(type)}
                    onCheckedChange={() => handleProductTypeToggle(type)}
                  />
                  <Label
                    htmlFor={`product-type-${type}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {type}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <Separator />
        </>
      )}

      {/* Supplier Country */}
      {supplierCountries.length > 0 && (
        <>
          <div className="space-y-3">
            <h3 className="font-medium text-sm">{t.supplierCountry}</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {supplierCountries.map((country) => (
                <div key={country} className="flex items-center space-x-2">
                  <Checkbox
                    id={`supplier-country-${country}`}
                    checked={selectedSupplierCountries.includes(country)}
                    onCheckedChange={() => handleSupplierCountryToggle(country)}
                  />
                  <Label
                    htmlFor={`supplier-country-${country}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {country}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

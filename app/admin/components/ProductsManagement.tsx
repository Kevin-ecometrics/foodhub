"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/app/lib/supabase/client";
import { FaPlus, FaEdit, FaSpinner, FaStar, FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import { Product, ProductFormData } from "../types";
import ProductForm from "./ProductForm";
import StarRating from "./StarRating";

type SortField = "category" | "price" | "rating" | "is_favorite" | "preparation_time" | "is_available";
type SortDir = "asc" | "desc";

interface ProductsManagementProps {
  onError: (error: string) => void;
}

interface ProductUpdate {
  is_available?: boolean;
  is_favorite?: boolean;
}

export default function ProductsManagement({
  onError,
}: ProductsManagementProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<ProductFormData>({
    name: "",
    description: "",
    price: "",
    category: "",
    image_url: "",
    preparation_time: "",
    is_available: true,
    is_favorite: false,
    rating: "0",
    extras: [],
  });

  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const sortedProducts = useMemo(() => {
    if (!sortField) return products;
    return [...products].sort((a, b) => {
      const av = a[sortField as keyof Product];
      const bv = b[sortField as keyof Product];
      const aNum = av === null || av === undefined ? -Infinity : Number(av);
      const bNum = bv === null || bv === undefined ? -Infinity : Number(bv);
      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === "asc" ? aNum - bNum : bNum - aNum;
    });
  }, [products, sortField, sortDir]);

  // Referencia para el formulario
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  // Efecto para hacer scroll cuando se muestra el formulario o cambia el producto editado
  useEffect(() => {
    if (showProductForm && formRef.current) {
      const scrollToForm = () => {
        formRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      };

      // Pequeño delay para asegurar que el DOM se haya actualizado
      const timer = setTimeout(scrollToForm, 100);

      return () => clearTimeout(timer);
    }
  }, [showProductForm, editingProduct?.id]); // Usar el ID del producto como dependencia

  const loadProducts = async () => {
    setProductsLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("is_favorite", { ascending: false })
        .order("name", { ascending: true });

      if (error) throw error;

      // Mapear los datos para asegurar que tengan la estructura correcta
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mappedProducts = (data || []).map((product: any) => ({
        ...product,
        rating: parseFloat(product.rating) || 0,
        rating_count: product.rating_count || 0,
        created_at: product.created_at || new Date().toISOString(),
        updated_at: product.updated_at || new Date().toISOString(),
        extras: product.extras || [],
      })) as Product[];

      setProducts(mappedProducts);
    } catch (error) {
      console.error("Error loading products:", error);
      onError("Error cargando los productos");
    } finally {
      setProductsLoading(false);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileName = `${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from("product-images")
      .getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let imageUrl = "";
      if (productForm.image_url && typeof productForm.image_url !== "string") {
        imageUrl = await uploadImage(productForm.image_url as File);
      } else {
        imageUrl = productForm.image_url as string;
      }

      const productData = {
        name: productForm.name,
        description: productForm.description,
        price: parseInt(productForm.price),
        category: productForm.category,
        image_url: imageUrl,
        preparation_time: parseInt(productForm.preparation_time) || null,
        is_available: productForm.is_available,
        is_favorite: productForm.is_favorite,
        rating: parseFloat(productForm.rating) || 0,
        rating_count: 0,
        extras: productForm.extras || [], // INCLUIR EXTRAS
      };

      const { error } = await supabase
        .from("products")
        .insert([productData as never]);

      if (error) throw error;

      setShowProductForm(false);
      setProductForm({
        name: "",
        description: "",
        price: "",
        category: "",
        image_url: "",
        preparation_time: "",
        is_available: true,
        is_favorite: false,
        rating: "0",
        extras: [],
      });
      await loadProducts();
      alert("✅ Producto creado con extras correctamente");
    } catch (error) {
      console.error("Error creating product:", error);
      onError("Error creando el producto");
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      let imageUrl = productForm.image_url as string | File;
      if (productForm.image_url && typeof productForm.image_url !== "string") {
        imageUrl = await uploadImage(productForm.image_url as File);
      }

      const productData = {
        name: productForm.name,
        description: productForm.description,
        price: parseInt(productForm.price),
        category: productForm.category,
        image_url: typeof imageUrl === "string" ? imageUrl : "",
        preparation_time: parseInt(productForm.preparation_time) || null,
        is_available: productForm.is_available,
        is_favorite: productForm.is_favorite,
        rating: parseFloat(productForm.rating) || 0,
        extras: productForm.extras || [], // INCLUIR EXTRAS
      };

      const { error } = await supabase
        .from("products")
        .update(productData as never)
        .eq("id", editingProduct.id);

      if (error) throw error;

      setShowProductForm(false);
      setEditingProduct(null);
      setProductForm({
        name: "",
        description: "",
        price: "",
        category: "",
        image_url: "",
        preparation_time: "",
        is_available: true,
        is_favorite: false,
        rating: "0",
        extras: [],
      });
      await loadProducts();
      alert("✅ Producto actualizado con extras correctamente");
    } catch (error) {
      console.error("Error updating product:", error);
      onError("Error actualizando el producto");
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      image_url: product.image_url || "",
      preparation_time: product.preparation_time?.toString() || "",
      is_available: product.is_available,
      is_favorite: product.is_favorite,
      rating: product.rating.toString(),
      extras: product.extras || [], // CARGAR EXTRAS EXISTENTES
    });

    // Asegurar que el formulario se muestre (por si acaso)
    if (!showProductForm) {
      setShowProductForm(true);
    }
  };

  const toggleProductAvailability = async (product: Product) => {
    try {
      const updateData = {
        is_available: !product.is_available,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("products")
        .update(updateData as never)
        .eq("id", product.id);

      if (error) throw error;
      await loadProducts();
    } catch (error) {
      console.error("Error updating product availability:", error);
      onError("Error actualizando la disponibilidad del producto");
    }
  };

  const toggleProductFavorite = async (product: Product) => {
    try {
      const updateData = {
        is_favorite: !product.is_favorite,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("products")
        .update(updateData as never)
        .eq("id", product.id);

      if (error) throw error;
      await loadProducts();
    } catch (error) {
      console.error("Error updating product favorite status:", error);
      onError("Error actualizando el estado de favorito del producto");
    }
  };

  // En el componente ProductsManagement, agrega esta función después de las otras funciones
  const handleDeleteProduct = async (productId: number) => {
    if (
      !confirm(
        "¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer."
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);

      if (error) throw error;

      // Si estamos editando el producto que se elimina, cerrar el formulario
      if (editingProduct?.id === productId) {
        setShowProductForm(false);
        setEditingProduct(null);
      }

      await loadProducts();
      alert("✅ Producto eliminado correctamente");
    } catch (error) {
      console.error("Error deleting product:", error);
      onError("Error eliminando el producto");
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  return (
    <div className="space-y-5" style={{fontFamily:"var(--font-geist-sans)"}}>
      <div className="flex justify-between items-center">
        <h2 className="text-[18px] font-extrabold text-slate-900">Gestión de Productos</h2>
        <button
          onClick={() => {
            setEditingProduct(null);
            setProductForm({
              name: "",
              description: "",
              price: "",
              category: "",
              image_url: "",
              preparation_time: "",
              is_available: true,
              is_favorite: false,
              rating: "0",
              extras: [],
            });
            setShowProductForm(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-[9px] bg-[var(--color-accent)] text-white text-xs font-bold hover:brightness-90 transition"
        >
          <FaPlus className="text-[11px]" />
          Nuevo Producto
        </button>
      </div>

      {/* Agregar referencia al formulario */}
      <div ref={formRef}>
        {showProductForm && (
          <ProductForm
            editingProduct={editingProduct}
            productForm={productForm}
            onSubmit={
              editingProduct ? handleUpdateProduct : handleCreateProduct
            }
            onCancel={() => {
              setShowProductForm(false);
              setEditingProduct(null);
            }}
            onFormChange={setProductForm}
            onDelete={
              editingProduct
                ? (productId: string) =>
                    handleDeleteProduct(parseInt(productId))
                : undefined
            }
          />
        )}
      </div>

      {productsLoading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 rounded-[14px] bg-[var(--color-accent)] flex items-center justify-center mx-auto">
            <svg className="animate-spin" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
          </div>
          <p className="text-slate-500 mt-4 text-sm font-medium">Cargando productos...</p>
        </div>
      ) : (
        <>
          {/* Vista Grid para Mobile */}
          <div className="sm:hidden grid grid-cols-1 gap-3">
            {sortedProducts.map((product) => (
              <div
                key={product.id}
                className={`bg-white rounded-[14px] border p-4 ${
                  product.is_favorite
                    ? "border-amber-200 bg-amber-50/40"
                    : "border-slate-200"
                }`}
              >
                <div className="flex gap-3">
                  {product.image_url && (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="h-16 w-16 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate flex items-center gap-1">
                          {product.name}
                          {product.is_favorite && (
                            <FaStar className="text-yellow-500 text-xs flex-shrink-0" />
                          )}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {product.description}
                        </p>
                      </div>

                      <button
                        onClick={() => handleEditProduct(product)}
                        className={` ml-2 flex-shrink-0 ${
                          product.is_favorite
                            ? "text-gray-600 hover:text-gray-900"
                            : "text-yellow-600 hover:text-yellow-900"
                        }`}
                      >
                        <FaEdit />
                      </button>
                    </div>

                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className="text-sm font-semibold text-green-600">
                        {formatCurrency(product.price)}
                      </span>

                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent-dark)]">
                        {product.category}
                      </span>

                      {product.preparation_time && (
                        <span className="text-xs text-gray-500">
                          {product.preparation_time}min
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <StarRating
                        rating={product.rating}
                        readonly={true}
                        size={12}
                      />

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleProductFavorite(product)}
                          className={`p-1 rounded-full transition-colors ${
                            product.is_favorite
                              ? "text-yellow-500 hover:text-yellow-600 bg-yellow-100"
                              : "text-gray-400 hover:text-yellow-500 hover:bg-yellow-50"
                          }`}
                        >
                          <FaStar size={14} />
                        </button>

                        <button
                          onClick={() => toggleProductAvailability(product)}
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            product.is_available
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {product.is_available ? "Disponible" : "No Disp."}
                        </button>
                      </div>
                    </div>

                    {product.extras && product.extras.length > 0 && (
                      <div className="text-xs text-green-600 mt-2">
                        +{product.extras.length} extras disponibles
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Vista Tabla para Desktop */}
          <div className="hidden sm:block bg-white border border-slate-200 rounded-[14px] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide">PRODUCTO</th>
                    {(
                      [
                        { label: "CATEGORÍA", field: "category" },
                        { label: "PRECIO", field: "price" },
                        { label: "CALIFICACIÓN", field: "rating" },
                        { label: "FAVORITO", field: "is_favorite" },
                        { label: "TIEMPO", field: "preparation_time" },
                        { label: "ESTADO", field: "is_available" },
                      ] as { label: string; field: SortField }[]
                    ).map(({ label, field }) => {
                      const active = sortField === field;
                      const Icon = active ? (sortDir === "asc" ? FaSortUp : FaSortDown) : FaSort;
                      return (
                        <th key={field} className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                          <button
                            onClick={() => handleSort(field)}
                            className={`flex items-center gap-1 hover:text-[var(--color-accent)] transition-colors ${active ? "text-[var(--color-accent)]" : ""}`}
                          >
                            {label}
                            <Icon className="text-[9px]" />
                          </button>
                        </th>
                      );
                    })}
                    <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide">ACCIONES</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {sortedProducts.map((product) => (
                    <tr
                      key={product.id}
                      className={`transition-colors ${
                        product.is_favorite
                          ? "bg-amber-50/40 hover:bg-amber-50/70"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="h-9 w-9 rounded-[8px] object-cover flex-shrink-0" />
                          ) : (
                            <div className="h-9 w-9 rounded-[8px] bg-slate-100 flex-shrink-0 flex items-center justify-center text-slate-400 text-xs">IMG</div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 flex items-center gap-1">
                              {product.name}
                              {product.is_favorite && <FaStar className="text-amber-500 text-[10px]" />}
                            </p>
                            <p className="text-[10px] text-slate-500 truncate max-w-[180px]">{product.description}</p>
                            {product.extras && product.extras.length > 0 && (
                              <p className="text-[10px] text-[var(--color-accent)] mt-0.5">+{product.extras.length} extras</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-[5px] bg-[var(--color-accent-light)] text-[var(--color-accent-dark)]">{product.category}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs font-bold text-slate-900">{formatCurrency(product.price)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StarRating rating={product.rating} readonly={true} size={13} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={() => toggleProductFavorite(product)}
                          className={`p-1 rounded-[6px] transition-colors ${
                            product.is_favorite
                              ? "text-amber-500 bg-amber-100"
                              : "text-slate-400 hover:text-amber-500 hover:bg-amber-50"
                          }`}
                          title={product.is_favorite ? "Quitar de favoritos" : "Marcar como favorito"}
                        >
                          <FaStar size={14} />
                        </button>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">
                        {product.preparation_time ? `${product.preparation_time} min` : "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={() => toggleProductAvailability(product)}
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-[6px] cursor-pointer ${
                            product.is_available
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-600"
                          }`}
                        >
                          {product.is_available ? "Disponible" : "No Disponible"}
                        </button>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="px-2.5 py-1.5 rounded-[7px] bg-amber-50 text-amber-600 text-[11px] font-bold hover:bg-amber-100 transition flex items-center gap-1"
                        >
                          <FaEdit className="text-[10px]" /> Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

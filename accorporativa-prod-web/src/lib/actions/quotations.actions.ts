'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Interfaces para tipos
export interface QuotationItem {
  id: string
  quotation_id: string
  product_id: string
  quantity: number
  unit_price: number
  item_subtotal: number
  item_total: number
  notes: string | null
  discount_type: 'PERCENTAGE' | 'FIXED' | null
  discount_value: number | null
  discount_amount: number | null
  tax_id: string | null
  created_at: string
  updated_at: string

  tax?: {
    id: string
    name: string
    description: string | null
    tax_type: "percentage" | "fixed_amount"
    rate: number
    is_active: boolean
    sat_tax_type: "iva" | "isr" | "ieps" | "local"
  }
  // Múltiples impuestos por producto
  product_taxes?: Array<{
    id: string
    name: string
    description?: string | null
    tax_type: "percentage" | "fixed_amount"
    rate: number
    is_active: boolean
    sat_tax_type: "iva" | "isr" | "ieps" | "local"
  }>
  product?: {
    id: string
    name: string
    description: string | null
    measure_unit: string | null
    tax_id: string | null
    tax?: {
      id: string;
      name: string;
      description: string | null;
      tax_type: "percentage" | "fixed_amount";
      rate: number;
      is_active: boolean;
      sat_tax_type: "iva" | "isr" | "ieps" | "local";
    }
  }
}

export interface QuotationMovementTest {
  id: string
  movement_date: string
  type: 'comment' | 'creation' | 'edition' | 'delete' | 'status' | string
  description: string
  details: {
    note?: string
    [key: string]: any
  } | null
  user_id: string | null
  user?: {
    id: string
    full_name: string
    email: string
  } | null
}

export interface Quotation {
  id: string
  quotation_number: string | null
  contact_id: string | null
  company_id: string | null
  price_list_id: string | null
  inventory_location_id: string | null
  subtotal: number
  discount_type: 'PERCENTAGE' | 'FIXED' | null
  discount_value: number | null
  discount_amount: number | null
  total: number
  valid_from: string
  valid_until: string
  customer_note: string | null
  status: 'pending' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted_to_order' | 'cancelled'
  created_at: string
  created_by: string | null
  updated_at: string
  updated_by: string | null
  deleted_at: string | null
  deleted_by: string | null
  seller_user_id?: string | null
  seller_contact_id?: string | null
  address?: string | null
  movements?: QuotationMovement[] // 👈 AGREGA ESTO
  
  // Relaciones
  contact?: {
    id: string
    name: string
    full_name?: string
    email: string | null
    phone: string | null
  }
  company?: {
    id: string
    name: string
    rfc: string | null
    street: string | null
    colony: string | null
    city: string | null
    state: string | null
    zip_code: string | null
    address_number: string | null
    phone: string | null
    cellphone: string | null
    website: string | null
  }
  price_list?: {
    id: string
    name: string
    code: string
  }
  inventory_location?: {
    id: string
    code: string
    name: string
    is_write_protected: boolean
  }
  items?: QuotationItem[]
  created_by_user?: {
    id: string
    full_name: string
    email: string
  }
  seller_user?: { 
    id: string
    full_name: string
    email: string
  } | null

  // movements?: Array<{
  //   id: string
  //   movement_date: string
  //   type: "comment" | "creation" | "edition" | "delete" | "status" | string
  //   description: string | null
  //   details: any | null
  //   user_id: string | null
  //   user?: {
  //     id: string
  //     full_name: string
  //     email: string
  //   } | null
  // }>
}
export interface QuotationMovement {
  id: string
  quotation_id: string
  type: string
  description: string | null
  details: any
  movement_date: string
  user_id: string | null
  created_at: string
  updated_at: string
}

export interface QuotationFormData {
  // Información del cliente
  clientName: string
  clientEmail?: string
  clientPhone?: string
  contactId?: string // Nuevo
  
  // Información de la cotización
  quotationNumber?: string
  validFrom: string
  validUntil: string
  notes?: string
  deliveryAddress?: string // Nuevo
  
  // Empresa y lista de precios
  companyId: string
  priceListId: string
  inventory_location_id?: string
  
  // Productos
  products: Array<{
    productId: string
    quantity: number
    unitPrice: number
    notes?: string
    // Descuento específico por producto
    discountType?: 'PERCENTAGE' | 'FIXED'
    discountValue?: number
    discountAmount?: number
    discountTitle?: string
    // Impuestos por producto
    tax_id?: string      // DEPRECADO: mantener por retrocompatibilidad
    tax_ids?: string[]   // NUEVO: soporta múltiples impuestos
    taxesData?: Array<{  // NUEVO: información detallada de cada impuesto aplicado
      id: string
      name: string
      tax_type: string
      rate: number
      amount: number
    }>
    tax?: Array<{
      id: string
      name: string
      description?: string
      tax_type: "percentage" | "fixed_amount"
      rate: number
      is_active: boolean
      sat_tax_type: "iva" | "isr" | "ieps" | "local"
    }>
  }>
  
  // Descuento general
  discountType?: 'PERCENTAGE' | 'FIXED'
  discountValue?: number
  discountAmount?: number
  discountTitle?: string
  
  // Totales
  subtotal: number
  total: number
  
  // Vendedor (usuario actual)
  vendor?: string
}

export interface QuotationsResponse {
  quotations: Quotation[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * Crea una nueva cotización
 */
export async function createQuotation(
  formData: QuotationFormData,
  userId: string
): Promise<{ success: boolean; quotationId?: string; quotationNumber?: number; error?: string }> {
  try {
    const supabase = await createClient()

    // ===== 1) Fetch masivo de taxes por IDs (para usar en el cálculo de items) =====
    // Recoger tanto tax_id (singular) como tax_ids (array) para retrocompatibilidad
    const taxIds = Array.from(
      new Set([
        ...formData.products
          .map(p => p.tax_id)
          .filter((id): id is string => Boolean(id)),
        ...formData.products
          .flatMap(p => p.tax_ids || [])
          .filter((id): id is string => Boolean(id))
      ])
    );

    const taxById = new Map<
      string,
      {
        id: string;
        name: string;
        tax_type: 'percentage' | 'fixed_amount';
        rate: number;
        is_active: boolean;
        sat_tax_type: string;
      }
    >();

    if (taxIds.length > 0) {
      const { data: taxesData, error: taxesError } = await supabase
        .from('taxes')
        .select('id, name, tax_type, rate, is_active, sat_tax_type')
        .in('id', taxIds)
        .is('deleted_at', null);

      if (taxesError) {
        console.error('Error fetching taxes:', taxesError);
      } else {
        (taxesData || []).forEach((t: any) => taxById.set(t.id, t));
      }
    }

    // Validaciones básicas
    if (!formData.clientName?.trim()) {
      return { success: false, error: 'El nombre del cliente es requerido' }
    }
    
    if (formData.products.length === 0) {
      return { success: false, error: 'Debe agregar al menos un producto' }
    }
    
    if (!formData.validUntil) {
      return { success: false, error: 'La fecha de vencimiento es requerida' }
    }
    
    if (!formData.companyId) {
      return { success: false, error: 'Selecciona una compañía' }
    }
    
    if (!formData.priceListId) {
      return { success: false, error: 'Selecciona una lista de precios' }
    }
    
    // Verificar si la compañía existe
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name')
      .eq('id', formData.companyId)
      .is('deleted_at', null)
      .single()
    
    if (companyError || !company) {
      return { success: false, error: 'La compañía seleccionada no existe' }
    }
    
    // Verificar si la lista de precios existe
    const { data: priceList, error: priceListError } = await supabase
      .from('price_lists')
      .select('id, name')
      .eq('id', formData.priceListId)
      .single()
    
    if (priceListError || !priceList) {
      return { success: false, error: 'La lista de precios seleccionada no existe' }
    }

    // Verificar si el almacén existe (solo si se proporciona)
    if (formData.inventory_location_id) {
      const { data: storage, error: storageError } = await supabase
        .from('inventories_locations')
        .select('id, name')
        .eq('id', formData.inventory_location_id)
        .eq('is_write_protected', false)
        .single()
      
      if (storageError || !storage) {
        return { success: false, error: 'El almacén seleccionado no existe' }
      }
    }
    
    let contactId: string | null = null
    
    // Si ya viene un contactId del formulario, usarlo directamente
    if (formData.contactId) {
      contactId = formData.contactId
      
      // Actualizar información del contacto si hay cambios
      if (formData.clientEmail || formData.clientPhone) {
        const updateData: any = {
          updated_at: new Date().toISOString()
        };
        
        if (formData.clientEmail) updateData.email = formData.clientEmail;
        if (formData.clientPhone) updateData.phone = formData.clientPhone;
        
        await supabase
          .from('contacts')
          .update(updateData)
          .eq('id', contactId)
      }
    } else if (formData.clientName.trim()) {
      // Solo buscar/crear por nombre si no viene contactId
      const { data: existingContact, error: contactSearchError } = await supabase
        .from('contacts')
        .select('id')
        .eq('full_name', formData.clientName.trim())
        .is('deleted_at', null)
        .maybeSingle()
      
      if (existingContact) {
        contactId = existingContact.id
        
        // Actualizar información del contacto si hay cambios
        if (formData.clientEmail || formData.clientPhone) {
          const updateData: any = {
            updated_at: new Date().toISOString()
          };
          
          if (formData.clientEmail) updateData.email = formData.clientEmail;
          if (formData.clientPhone) updateData.phone = formData.clientPhone;
          
          await supabase
            .from('contacts')
            .update(updateData)
            .eq('id', contactId)
        }
      } else {
        // Crear nuevo contacto
        const contactData = {
          full_name: formData.clientName.trim(),
          email: formData.clientEmail || null,
          phone: formData.clientPhone || null,
          created_at: new Date().toISOString(),
          created_by: userId
        };
        
        const { data: newContact, error: contactError } = await supabase
          .from('contacts')
          .insert(contactData)
          .select('id')
          .single()
        
        if (contactError) {
          console.error('Error creando contacto:', contactError)
        } else if (newContact) {
          contactId = newContact.id
        }
      }
    }
    
    // **IMPORTANTE: NO envíes quotation_number - la secuencia lo genera**
    const quotationData = {
      contact_id: contactId,
      company_id: formData.companyId,
      price_list_id: formData.priceListId,
      inventory_location_id: formData.inventory_location_id,
      seller_user_id: userId,
      seller_contact_id: null,
      address: formData.deliveryAddress || null, 
      subtotal: formData.subtotal,
      discount_type: formData.discountType || null,
      discount_value: formData.discountValue || null,
      discount_amount: formData.discountAmount || null,
      discount_title: formData.discountTitle || null,
      total: formData.total,
      valid_from: formData.validFrom,
      valid_until: formData.validUntil,
      customer_note: formData.notes || null,
      status: 'pending',
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: quotation, error: quotationError } = await supabase
      .from('quotations')
      .insert(quotationData)
      .select('id, quotation_number')
      .single();
    
    if (quotationError) {
      console.error('❌ Error creando cotización:', quotationError)
      return { 
        success: false, 
        error: `Error al crear la cotización: ${quotationError.message}` 
      }
    }
    
    // Crear los detalles de la cotización
    const quotationItems = formData.products
      .filter(product => !product.productId.startsWith('discount-')) 
      .map(product => {
        const itemSubtotal = product.quantity * product.unitPrice;
        let itemDiscountAmount = 0;
        let itemTaxAmount = 0;
        
        // Calcular descuento específico si existe
        if (product.discountType && product.discountValue) {
          if (product.discountType === 'PERCENTAGE') {
            itemDiscountAmount = (itemSubtotal * product.discountValue) / 100;
          } else if (product.discountType === 'FIXED') {
            itemDiscountAmount = product.discountValue;
          }
        }
        
        const itemSubtotal2 = itemSubtotal - itemDiscountAmount;

        // Determinar qué impuestos aplicar (prioridad: tax_ids > tax_id)
        const taxIdsToApply = product.tax_ids?.length 
          ? product.tax_ids 
          : (product.tax_id ? [product.tax_id] : []);

        // Validar y eliminar duplicados
        const uniqueTaxIds = Array.from(new Set(taxIdsToApply));

        // Calcular la SUMA de todos los impuestos aplicables
        uniqueTaxIds.forEach(tid => {
          const taxObj = taxById.get(tid);
          if (taxObj) {
            if (taxObj.tax_type === 'percentage') {
              itemTaxAmount += (itemSubtotal2 * taxObj.rate) / 100;
            } else if (taxObj.tax_type === 'fixed_amount') {
              itemTaxAmount += taxObj.rate;
            }
          }
        });

        const itemTotal = itemSubtotal2 + itemTaxAmount;
        
        const itemData = {
          quotation_id: quotation.id,
          product_id: product.productId,
          quantity: product.quantity,
          unit_price: product.unitPrice,
          item_subtotal: itemSubtotal,
          discount_title: product.discountTitle || null,
          discount_type: product.discountType || null,
          discount_value: product.discountValue || null,
          discount_amount: itemDiscountAmount || null,
          tax_id: null, // Ya no se usa, ahora solo tax_ids en tabla de relaciones
          item_total: itemTotal,
          notes: product.notes || null,
          created_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          updated_by: userId
        };
        
        return itemData;
      });
    
    if (quotationItems.length > 0) {
      const { data: insertedItems, error: itemsError } = await supabase
        .from('quotations_details')
        .insert(quotationItems)
        .select('id, product_id');
      
      if (itemsError) {
        console.error('❌ Error creando detalles:', {
          code: itemsError.code,
          message: itemsError.message,
          details: itemsError.details
        });
        
        // Intentar eliminar la cotización creada si fallan los detalles
        await supabase
          .from('quotations')
          .delete()
          .eq('id', quotation.id);
        
        return { 
          success: false, 
          error: 'Error al guardar los productos de la cotización' 
        }
      }

      // ===== 2) Insertar relaciones en quotations_details_product_taxes =====
      if (insertedItems && insertedItems.length > 0) {
        const taxRelations: Array<{
          id: string;
          quotation_detail_id: string;
          tax_id: string;
          created_by: string;
        }> = [];

        // Crear un mapa de product_id -> detail_id para búsqueda eficiente
        const productIdToDetailId = new Map<string, string>();
        insertedItems.forEach(item => {
          productIdToDetailId.set(item.product_id, item.id);
        });

        // Filtrar productos reales (sin discount-)
        const realProducts = formData.products.filter(
          product => !product.productId.startsWith('discount-')
        );

        realProducts.forEach((product) => {
          // Buscar el detail_id correspondiente usando product_id
          const detailId = productIdToDetailId.get(product.productId);
          if (!detailId) return;

          // Calcular base imponible (subtotal - descuento)
          const itemSubtotal = product.quantity * product.unitPrice;
          let itemDiscountAmount = 0;
          
          if (product.discountType && product.discountValue) {
            if (product.discountType === 'PERCENTAGE') {
              itemDiscountAmount = (itemSubtotal * product.discountValue) / 100;
            } else if (product.discountType === 'FIXED') {
              itemDiscountAmount = product.discountValue;
            }
          }
          
          const taxableBase = itemSubtotal - itemDiscountAmount;

          // Determinar impuestos a aplicar (prioridad: tax_ids > tax_id)
          const taxIdsToApply = product.tax_ids?.length 
            ? product.tax_ids 
            : (product.tax_id ? [product.tax_id] : []);

          // Eliminar duplicados y filtrar undefined/null
          const uniqueTaxIds = Array.from(new Set(taxIdsToApply)).filter(id => id);

          uniqueTaxIds.forEach(tax_id => {
            taxRelations.push({
              id: crypto.randomUUID(),
              quotation_detail_id: detailId,
              tax_id: tax_id,
              created_by: userId,
            });
          });
        });

        // Insertar todas las relaciones de impuestos
        if (taxRelations.length > 0) {
          const { error: taxRelationsError } = await supabase
            .from('quotations_details_product_taxes')
            .insert(taxRelations);

          if (taxRelationsError) {
            console.error('❌ Error insertando impuestos:', {
              error: taxRelationsError,
              userId: userId,
              taxRelationsCount: taxRelations.length,
              sample: taxRelations[0]
            });
            
            // Rollback: eliminar cotización y detalles
            await supabase.from('quotations_details').delete().eq('quotation_id', quotation.id);
            await supabase.from('quotations').delete().eq('id', quotation.id);
            
            return {
              success: false,
              error: `Error al asignar impuestos: ${taxRelationsError.message}`
            };
          }
        }
      }
    }
    
    // Movement log  de create eliminado
    
    revalidatePath('/dashboard/cotizaciones');
    return { 
      success: true, 
      quotationId: quotation.id,
      quotationNumber: quotation.quotation_number 
    };
    
  } catch (error) {
    console.error('💥 Error inesperado creando cotización:', error);
    return { 
      success: false, 
      error: 'Error inesperado del servidor' 
    }
  }
}

/**
 * Actualiza una cotización existente
 */
export async function updateQuotation(
  quotationId: string,
  formData: QuotationFormData,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[updateQuotation] Iniciando actualización de cotización:', quotationId);
    console.log('[updateQuotation] Número de productos recibidos:', formData.products.length);
    console.log('[updateQuotation] Productos con impuestos:', 
      formData.products.filter(p => p.tax_ids && p.tax_ids.length > 0).length
    );
    
    const supabase = await createClient()
    
    // Verificar que la cotización existe y está en estado "pending"
    const { data: existingQuotation, error: fetchError } = await supabase
      .from('quotations')
      .select('id, status, quotation_number')
      .eq('id', quotationId)
      .is('deleted_at', null)
      .single()
    
    if (fetchError || !existingQuotation) {
      return { success: false, error: 'La cotización no existe' }
    }
    
    if (existingQuotation.status !== 'pending') {
      return { success: false, error: 'Solo se pueden editar cotizaciones en estado pendiente' }
    }
    
    // Validaciones básicas
    if (!formData.clientName?.trim()) {
      return { success: false, error: 'El nombre del cliente es requerido' }
    }
    
    if (formData.products.length === 0) {
      return { success: false, error: 'Debe agregar al menos un producto' }
    }
    
    if (!formData.validUntil) {
      return { success: false, error: 'La fecha de vencimiento es requerida' }
    }
    
    if (!formData.companyId) {
      return { success: false, error: 'Selecciona una compañía' }
    }
    
    if (!formData.priceListId) {
      return { success: false, error: 'Selecciona una lista de precios' }
    }

    if (!formData.inventory_location_id) {
      return { success: false, error: 'Selecciona un almacén' }
    }
    
    // Verificar si la compañía existe
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name')
      .eq('id', formData.companyId)
      .is('deleted_at', null)
      .single()
    
    if (companyError || !company) {
      return { success: false, error: 'La compañía seleccionada no existe' }
    }
    
    // Verificar si la lista de precios existe
    const { data: priceList, error: priceListError } = await supabase
      .from('price_lists')
      .select('id, name')
      .eq('id', formData.priceListId)
      .single()
    
    if (priceListError || !priceList) {
      return { success: false, error: 'La lista de precios seleccionada no existe' }
    }

    // Verificar si el almacén existe (solo si se proporciona)
    if (formData.inventory_location_id) {
      const { data: storage, error: storageError } = await supabase
        .from('inventories_locations')
        .select('id, name')
        .eq('id', formData.inventory_location_id)
        .eq('is_write_protected', false)
        .single()
      
      if (storageError || !storage) {
        return { success: false, error: 'El almacén seleccionado no existe' }
      }
    }
    
    let contactId: string | null = null
    
    // Si ya viene un contactId del formulario, usarlo directamente
    if (formData.contactId) {
      contactId = formData.contactId
      
      // Actualizar información del contacto si hay cambios
      if (formData.clientEmail || formData.clientPhone) {
        const updateData: any = {
          updated_at: new Date().toISOString()
        };
        
        if (formData.clientEmail) updateData.email = formData.clientEmail;
        if (formData.clientPhone) updateData.phone = formData.clientPhone;
        
        await supabase
          .from('contacts')
          .update(updateData)
          .eq('id', contactId)
      }
    } else if (formData.clientName.trim()) {
      // Solo buscar/crear por nombre si no viene contactId
      const { data: existingContact, error: contactSearchError } = await supabase
        .from('contacts')
        .select('id')
        .eq('full_name', formData.clientName.trim())
        .is('deleted_at', null)
        .maybeSingle()
      
      if (existingContact) {
        contactId = existingContact.id
        
        // Actualizar información del contacto si hay cambios
        if (formData.clientEmail || formData.clientPhone) {
          const updateData: any = {
            updated_at: new Date().toISOString()
          };
          
          if (formData.clientEmail) updateData.email = formData.clientEmail;
          if (formData.clientPhone) updateData.phone = formData.clientPhone;
          
          await supabase
            .from('contacts')
            .update(updateData)
            .eq('id', contactId)
        }
      } else {
        // Crear nuevo contacto
        const contactData = {
          full_name: formData.clientName.trim(),
          email: formData.clientEmail || null,
          phone: formData.clientPhone || null,
          created_at: new Date().toISOString(),
          created_by: userId
        };
        
        const { data: newContact, error: contactError } = await supabase
          .from('contacts')
          .insert(contactData)
          .select('id')
          .single()
        
        if (contactError) {
          console.error('Error creando contacto:', contactError)
        } else if (newContact) {
          contactId = newContact.id
        }
      }
    }
    
    // Actualizar la cotización (NO incluir quotation_number)
    const quotationData = {
      contact_id: contactId,
      company_id: formData.companyId,
      price_list_id: formData.priceListId,
      inventory_location_id: formData.inventory_location_id,
      seller_user_id: userId,
      address: formData.deliveryAddress || null, 
      subtotal: formData.subtotal,
      discount_type: formData.discountType || null,
      discount_value: formData.discountValue || null,
      discount_amount: formData.discountAmount || null,
      discount_title: formData.discountTitle || null,
      total: formData.total,
      valid_from: formData.validFrom,
      valid_until: formData.validUntil,
      customer_note: formData.notes || null,
      updated_by: userId,
      updated_at: new Date().toISOString()
    };
    
    const { error: quotationError } = await supabase
      .from('quotations')
      .update(quotationData)
      .eq('id', quotationId);
    
      if (quotationError) {
      console.error('🔥 ERROR REAL SUPABASE quotations:', quotationError);

      return { 
        success: false, 
        error: quotationError.message // ✅ DEVUELVE EL ERROR REAL
      }
    }

    
    console.log('[updateQuotation] Cotización actualizada exitosamente');
    console.log('[updateQuotation] Actualizando items de la cotización...');
    
    // Obtener los items existentes (activos) con sus IDs y product_ids
    const { data: existingItems, error: fetchItemsError } = await supabase
      .from('quotations_details')
      .select('id, product_id')
      .eq('quotation_id', quotationId)
      .is('deleted_at', null);
    
    if (fetchItemsError) {
      console.error('[updateQuotation] Error obteniendo items existentes:', fetchItemsError);
    }
    
    // Crear mapa de product_id → detail_id de items existentes
    const existingItemsMap = new Map<string, string>();
    (existingItems || []).forEach((item: any) => {
      existingItemsMap.set(item.product_id, item.id);
    });
    
    console.log('[updateQuotation] Items existentes:', existingItemsMap.size);
    
    // ===== Fetch masivo de taxes por IDs (para usar en el cálculo de items) =====
    const allTaxIds = Array.from(
      new Set(
        formData.products.flatMap(p => {
          // Soportar tanto tax_id (legado) como tax_ids (nuevo)
          const ids: string[] = [];
          if (p.tax_id) ids.push(p.tax_id);
          if (p.tax_ids && Array.isArray(p.tax_ids)) {
            ids.push(...p.tax_ids.filter((id): id is string => Boolean(id)));
          }
          return ids;
        })
      )
    );

    console.log('[updateQuotation] IDs de impuestos extraídos:', allTaxIds);

    const taxById = new Map<string, any>();

    if (allTaxIds.length > 0) {
      const { data: taxesData, error: taxesError } = await supabase
        .from('taxes')
        .select('id, name, tax_type, rate, is_active, sat_tax_type')
        .in('id', allTaxIds)
        .is('deleted_at', null);

      if (taxesError) {
        console.error('[updateQuotation] Error fetching taxes:', taxesError);
      } else {
        (taxesData || []).forEach((t: any) => taxById.set(t.id, t));
        console.log('[updateQuotation] Impuestos cargados desde DB:', taxesData?.length || 0);
      }
    }

    // Procesar cada producto del formulario
    const productIdsInForm = new Set<string>();
    const itemsToUpdate: any[] = [];
    const itemsToInsert: any[] = [];
    const productIdToDetailId = new Map<string, string>(); // Para mapear luego los impuestos

    formData.products
      .filter(product => !product.productId.startsWith('discount-') && !product.productId.startsWith('tax-'))
      .forEach(product => {
        productIdsInForm.add(product.productId);
        
        const itemSubtotal = product.quantity * product.unitPrice;
        let itemDiscountAmount = 0;
        let itemTaxAmount = 0;
        
        // Calcular descuento específico si existe
        if (product.discountType && product.discountValue) {
          if (product.discountType === 'PERCENTAGE') {
            itemDiscountAmount = (itemSubtotal * product.discountValue) / 100;
          } else if (product.discountType === 'FIXED') {
            itemDiscountAmount = product.discountValue;
          }
        }
        
        // Calcular impuesto(s) específico(s) si existe(n)
        const taxableBase = itemSubtotal - itemDiscountAmount;
        const productTaxIds = product.tax_ids && Array.isArray(product.tax_ids) && product.tax_ids.length > 0
          ? product.tax_ids
          : (product.tax_id ? [product.tax_id] : []);

        productTaxIds.forEach(tid => {
          const taxObj = taxById.get(tid);
          if (taxObj) {
            if (taxObj.tax_type === 'percentage') {
              itemTaxAmount += (taxableBase * taxObj.rate) / 100;
            } else if (taxObj.tax_type === 'fixed_amount') {
              itemTaxAmount += taxObj.rate;
            }
          }
        });

        const itemTotal = taxableBase + itemTaxAmount;
        
        const existingDetailId = existingItemsMap.get(product.productId);
        
        if (existingDetailId) {
          // El item ya existe, UPDATE manteniendo el mismo ID
          productIdToDetailId.set(product.productId, existingDetailId);
          itemsToUpdate.push({
            id: existingDetailId,
            product_id: product.productId,
            quantity: product.quantity,
            unit_price: product.unitPrice,
            item_subtotal: itemSubtotal,
            discount_title: product.discountTitle || null,
            discount_type: product.discountType || null,
            discount_value: product.discountValue || null,
            discount_amount: itemDiscountAmount || null,
            tax_id: null,
            item_total: itemTotal,
            notes: product.notes || null,
            updated_at: new Date().toISOString(),
            updated_by: userId,
            tax_ids: productTaxIds // Guardar temporalmente para después
          });
        } else {
          // El item no existe, INSERT
          itemsToInsert.push({
            quotation_id: quotationId,
            product_id: product.productId,
            quantity: product.quantity,
            unit_price: product.unitPrice,
            item_subtotal: itemSubtotal,
            discount_title: product.discountTitle || null,
            discount_type: product.discountType || null,
            discount_value: product.discountValue || null,
            discount_amount: itemDiscountAmount || null,
            tax_id: null,
            item_total: itemTotal,
            notes: product.notes || null,
            created_by: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            updated_by: userId,
            tax_ids: productTaxIds // Guardar temporalmente para después
          });
        }
      });
    
    console.log('[updateQuotation] Items a actualizar:', itemsToUpdate.length);
    console.log('[updateQuotation] Items a insertar:', itemsToInsert.length);
    
    // UPDATE items existentes (uno por uno para mantener IDs)
    for (const item of itemsToUpdate) {
      const { tax_ids, ...itemDataWithoutTaxIds } = item;
      const { error: updateError } = await supabase
        .from('quotations_details')
        .update(itemDataWithoutTaxIds)
        .eq('id', item.id);
      
      if (updateError) {
        console.error('[updateQuotation] Error actualizando item:', item.id, updateError);
        return {
          success: false,
          error: 'Error al actualizar los productos de la cotización'
        };
      }
    }
    
    // INSERT items nuevos
    if (itemsToInsert.length > 0) {
      const itemsToInsertClean = itemsToInsert.map(({ tax_ids, ...item }) => item);
      const { data: insertedItems, error: insertError } = await supabase
        .from('quotations_details')
        .insert(itemsToInsertClean)
        .select('id, product_id');
      
      if (insertError) {
        console.error('[updateQuotation] Error insertando items:', insertError);
        return {
          success: false,
          error: 'Error al guardar los productos de la cotización'
        };
      }
      
      // Mapear los IDs de los items nuevos
      (insertedItems || []).forEach((item: any) => {
        productIdToDetailId.set(item.product_id, item.id);
      });
    }
    
    console.log('[updateQuotation] Items actualizados/insertados exitosamente');
    
    // Soft delete de items que ya no están en el formulario
    const itemIdsToDelete = (existingItems || [])
      .filter((item: any) => !productIdsInForm.has(item.product_id))
      .map((item: any) => item.id);
    
    if (itemIdsToDelete.length > 0) {
      console.log('[updateQuotation] Items a marcar como eliminados:', itemIdsToDelete);
      
      // Soft delete de relaciones primero
      const { error: softDeleteTaxRelError } = await supabase
        .from('quotations_details_product_taxes')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: userId
        })
        .in('quotation_detail_id', itemIdsToDelete)
        .is('deleted_at', null);
      
      if (softDeleteTaxRelError) {
        console.error('[updateQuotation] Error soft delete relaciones:', softDeleteTaxRelError);
      }
      
      // Soft delete de items
      const { error: softDeleteItemsError } = await supabase
        .from('quotations_details')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: userId
        })
        .in('id', itemIdsToDelete);
      
      if (softDeleteItemsError) {
        console.error('[updateQuotation] Error soft delete items:', softDeleteItemsError);
      }
    }
    
    // Ahora manejar las relaciones de impuestos de forma inteligente
    // Para cada item, actualizar sus relaciones de impuestos
    const allItems = [...itemsToUpdate, ...itemsToInsert];
    
    for (const item of allItems) {
      const detailId = productIdToDetailId.get(item.product_id);
      if (!detailId) continue;
      
      const newTaxIds = new Set<string>(item.tax_ids || []);
      
      // 1. Obtener las relaciones de impuestos actuales (incluyendo soft deleted)
      const { data: existingRelations, error: fetchRelError } = await supabase
        .from('quotations_details_product_taxes')
        .select('id, tax_id, deleted_at')
        .eq('quotation_detail_id', detailId);
      
      if (fetchRelError) {
        console.error('[updateQuotation] Error obteniendo relaciones existentes:', fetchRelError);
        continue;
      }
      
      // Mapas para control
      const activeRelations = new Map<string, string>(); // tax_id → relation_id
      const deletedRelations = new Map<string, string>(); // tax_id → relation_id
      
      (existingRelations || []).forEach((rel: any) => {
        if (rel.deleted_at) {
          deletedRelations.set(rel.tax_id, rel.id);
        } else {
          activeRelations.set(rel.tax_id, rel.id);
        }
      });
      
      // 2. Soft delete de impuestos que ya no están en la nueva lista
      const taxIdsToDelete: string[] = [];
      activeRelations.forEach((relationId, taxId) => {
        if (!newTaxIds.has(taxId)) {
          taxIdsToDelete.push(relationId);
        }
      });
      
      if (taxIdsToDelete.length > 0) {
        const { error: softDeleteError } = await supabase
          .from('quotations_details_product_taxes')
          .update({
            deleted_at: new Date().toISOString(),
            deleted_by: userId
          })
          .in('id', taxIdsToDelete);
        
        if (softDeleteError) {
          console.error('[updateQuotation] Error soft delete relaciones:', softDeleteError);
        }
      }
      
      // 3. Procesar cada impuesto de la nueva lista
      const relationsToInsert: any[] = [];
      const relationIdsToUpdate: string[] = [];
      
      newTaxIds.forEach((taxId: string) => {
        if (activeRelations.has(taxId)) {
          // El impuesto ya existe y está activo → UPDATE updated_at
          relationIdsToUpdate.push(activeRelations.get(taxId)!);
        } else if (deletedRelations.has(taxId)) {
          // El impuesto existía pero fue soft deleted → INSERT nuevo registro
          relationsToInsert.push({
            id: crypto.randomUUID(),
            quotation_detail_id: detailId,
            tax_id: taxId,
            created_at: new Date().toISOString(),
            created_by: userId
          });
        } else {
          // El impuesto es completamente nuevo → INSERT
          relationsToInsert.push({
            id: crypto.randomUUID(),
            quotation_detail_id: detailId,
            tax_id: taxId,
            created_at: new Date().toISOString(),
            created_by: userId
          });
        }
      });
      
      // 4. UPDATE de relaciones que siguen activas (solo updated_at)
      if (relationIdsToUpdate.length > 0) {
        const { error: updateError } = await supabase
          .from('quotations_details_product_taxes')
          .update({
            updated_at: new Date().toISOString(),
            updated_by: userId
          })
          .in('id', relationIdsToUpdate);
        
        if (updateError) {
          console.error('[updateQuotation] Error actualizando relaciones:', updateError);
        }
      }
      
      // 5. INSERT de relaciones nuevas
      if (relationsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('quotations_details_product_taxes')
          .insert(relationsToInsert);
        
        if (insertError) {
          console.error('[updateQuotation] Error insertando relaciones:', insertError);
        }
      }
    }
    
    // Movement log  de update eliminado
    
    revalidatePath('/dashboard/cotizaciones-padre/cotizaciones');
    revalidatePath(`/dashboard/cotizaciones-padre/cotizaciones/editar/${quotationId}`);
    
    return { success: true };
       
  } catch (error) {
    console.error('Error inesperado actualizando cotización:', error);
    return { 
      success: false, 
      error: 'Error inesperado del servidor' 
    }
  }
}







// **CORRECCIÓN: Cambia la función generateQuotationNumber**
// Si quotation_number es autoincremental, no necesitas generar números
async function getNextQuotationNumber(): Promise<number | null> {
  try {
    const supabase = await createClient();
    
    // Obtener el último número de cotización
    const { data: lastQuotation, error } = await supabase
      .from('quotations')
      .select('quotation_number')
      .order('quotation_number', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Error obteniendo último número:', error);
      return null;
    }
    
    if (lastQuotation) {
      return lastQuotation.quotation_number + 1;
    }
    
    return 1; // Primera cotización
    
  } catch (error) {
    console.error('Error obteniendo próximo número:', error);
    return null;
  }
}

/**
 * Genera un número único de cotización
 */
async function generateQuotationNumber(): Promise<string> {
  const supabase = await createClient()
  
  // Obtener el último número de cotización del año actual
  const currentYear = new Date().getFullYear()
  const yearPrefix = currentYear.toString().slice(-2)
  
  const { data: lastQuotation } = await supabase
    .from('quotations')
    .select('quotation_number')
    .like('quotation_number', `COT-${yearPrefix}%`)
    .order('quotation_number', { ascending: false })
    .limit(1)
    .single()
  
  let nextNumber = 1
  
  if (lastQuotation?.quotation_number) {
    // Extraer el número secuencial del último código
    const lastNumber = parseInt(lastQuotation.quotation_number.slice(-4)) || 0
    nextNumber = lastNumber + 1
  }
  
  // Formato: COT-YY-XXXX (ej: COT-24-0001)
  return `COT-${yearPrefix}-${nextNumber.toString().padStart(4, '0')}`
}

/**
 * Obtiene cotizaciones con paginación
 */
export async function getQuotations(
  page = 1,
  pageSize = 10,
  search = '',
  statusFilter = '',
  companyFilter = '',
  sortBy = 'created_at',
  sortOrder: 'asc' | 'desc' = 'desc',
  vendorId = '',
  contactId = '',
  dateFrom = '',
  dateTo = '',
  statusFilters: string[] = [],
  productName = ''
): Promise<QuotationsResponse> {
  try {
    const supabase = await createClient()
    
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
        
    // IDs para filtrar por búsqueda en tablas relacionadas
    let quotationIdsFromSearch: string[] = []
    
    // Si hay búsqueda, buscar en múltiples lugares
    if (search.trim()) {
      const searchTerm = `%${search.trim()}%`
      
      // Buscar cotizaciones directamente por número o nota
      const { data: directQuotations } = await supabase
        .from('quotations')
        .select('id')
        .is('deleted_at', null)
        .or(`quotation_number.ilike.${searchTerm},customer_note.ilike.${searchTerm}`)
      
      if (directQuotations && directQuotations.length > 0) {
        quotationIdsFromSearch = directQuotations.map(q => q.id)
      }
      
      // Buscar contactos por nombre
      const { data: contacts } = await supabase
        .from('contacts')
        .select('id')
        .ilike('full_name', searchTerm)
      
      if (contacts && contacts.length > 0) {
        const contactIds = contacts.map(c => c.id)
        
        // Buscar cotizaciones de estos contactos
        const { data: contactQuotations } = await supabase
          .from('quotations')
          .select('id')
          .is('deleted_at', null)
          .in('contact_id', contactIds)
        
        if (contactQuotations && contactQuotations.length > 0) {
          quotationIdsFromSearch = [...new Set([...quotationIdsFromSearch, ...contactQuotations.map(q => q.id)])]
        }
      }
      
      // Buscar empresas por nombre
      const { data: companies } = await supabase
        .from('companies')
        .select('id')
        .ilike('name', searchTerm)
      
      if (companies && companies.length > 0) {
        const companyIds = companies.map(c => c.id)
        
        // Buscar cotizaciones de estas empresas
        const { data: companyQuotations } = await supabase
          .from('quotations')
          .select('id')
          .is('deleted_at', null)
          .in('company_id', companyIds)
        
        if (companyQuotations && companyQuotations.length > 0) {
          quotationIdsFromSearch = [...new Set([...quotationIdsFromSearch, ...companyQuotations.map(q => q.id)])]
        }
      }
      
      
      // Si hay búsqueda pero no se encontró nada, retornar vacío
      if (quotationIdsFromSearch.length === 0) {
        return {
          quotations: [],
          total: 0,
          page,
          pageSize,
          totalPages: 0
        }
      }
    }
    
    // Si hay filtro de producto, primero obtener los IDs de cotizaciones que lo contienen
    let quotationIdsWithProduct: string[] = []
    if (productName.trim()) {
      const { data: quotationDetails } = await supabase
        .from('quotations_details')
        .select('quotation_id, product:product_id(name)')
        .is('deleted_at', null)
        .ilike('product.name', `%${productName.trim()}%`)
      
      if (quotationDetails && quotationDetails.length > 0) {
        quotationIdsWithProduct = [...new Set(quotationDetails.map(item => item.quotation_id))]
        console.log('✅ Cotizaciones con producto:', quotationIdsWithProduct.length)
      } else {
        // Si no hay cotizaciones con ese producto, retornar vacío
        return {
          quotations: [],
          total: 0,
          page,
          pageSize,
          totalPages: 0
        }
      }
    }
    
    // Obtener las cotizaciones básicas
    let query = supabase
      .from('quotations')
      .select(
        `
        *,
        contact:contact_id (id, full_name, email, phone),
        company:company_id (id, name, rfc, street, colony, city, state, zip_code, address_number, phone, cellphone, website),
        price_list:price_list_id (id, name, code),
        inventories_locations: inventory_location_id (id, code, name),
        items:quotations_details (
          *,
          product:product_id (
            id,
            name,
            description,
            measure_unit
          ),
          tax:tax_id (id, name, tax_type, rate, is_active, sat_tax_type)
        )
        `,
        { count: 'exact' }
      )
      .is('deleted_at', null)
      .order(sortBy, { ascending: sortOrder === 'asc' })
    
    // Si hay búsqueda, filtrar por los IDs encontrados
    if (search.trim() && quotationIdsFromSearch.length > 0) {
      query = query.in('id', quotationIdsFromSearch)
    }
    
    // Filtro de estado único (legacy)
    if (statusFilter) {
      query = query.eq('status', statusFilter)
    }
    
    // Filtro de múltiples estados
    if (statusFilters && statusFilters.length > 0) {
      query = query.in('status', statusFilters)
    }
    
    if (companyFilter) {
      query = query.eq('company_id', companyFilter)
    }
    
    // Filtro de vendedor (seller_user_id o created_by)
    if (vendorId) {
      query = query.or(`seller_user_id.eq.${vendorId},created_by.eq.${vendorId}`)
    }
    
    // Filtro de contacto/cliente
    if (contactId) {
      query = query.eq('contact_id', contactId)
    }
    
    // Filtro de fecha desde
    if (dateFrom) {
      const fromDate = new Date(dateFrom)
      fromDate.setHours(0, 0, 0, 0)
      query = query.gte('created_at', fromDate.toISOString())
    }
    
    // Filtro de fecha hasta
    if (dateTo) {
      const toDate = new Date(dateTo)
      toDate.setHours(23, 59, 59, 999)
      query = query.lte('created_at', toDate.toISOString())
    }
    
    // Filtro de producto (usando los IDs obtenidos previamente)
    if (productName.trim() && quotationIdsWithProduct.length > 0) {
      query = query.in('id', quotationIdsWithProduct)
    }
    
    const { data, error, count } = await query.range(from, to)
    
    if (error) {
      console.error('Error obteniendo cotizaciones:', error)
      throw new Error('Error al cargar cotizaciones')
    }
    
    // Filtrar items no eliminados de cada cotización
    if (data && Array.isArray(data)) {
      data.forEach((quotation: any) => {
        if (quotation.items && Array.isArray(quotation.items)) {
          quotation.items = quotation.items.filter((item: any) => !item.deleted_at);
        }
      });
    }
    
    // Obtener información de los vendedores
    const userIds: string[] = []
    
    // Recopilar todos los IDs de vendedores únicos
    ;(data || []).forEach(quotation => {
      if (quotation.seller_user_id && !userIds.includes(quotation.seller_user_id)) {
        userIds.push(quotation.seller_user_id)
      }
      if (quotation.created_by && !userIds.includes(quotation.created_by)) {
        userIds.push(quotation.created_by)
      }
    })
    
    // Obtener información de usuarios si hay IDs
    const userMap = new Map()
    if (userIds.length > 0) {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('id', userIds)
      
      if (usersError) {
        console.error('Error obteniendo usuarios:', usersError)
      } else if (usersData) {
        usersData.forEach(user => {
          userMap.set(user.id, {
            id: user.id,
            full_name: user.full_name || 'Usuario',
            email: user.email || ''
          })
        })
      }
    }
    
    const formattedData = (data || []).map(quotation => {
      // Convertir quotation_number de bigint a string
      const quotationNumber = quotation.quotation_number 
        ? quotation.quotation_number.toString() 
        : null
      
      // Asegurar que contact tenga el campo 'name'
      const contact = quotation.contact ? {
        ...quotation.contact,
        name: quotation.contact.full_name || ''
      } : null
      
      // Obtener información del vendedor (seller_user)
      let seller_user = null
      if (quotation.seller_user_id) {
        const userInfo = userMap.get(quotation.seller_user_id)
        if (userInfo) {
          seller_user = userInfo
        }
      }
      
      // Obtener información del usuario creador (created_by_user)
      let created_by_user = null
      if (quotation.created_by) {
        const userInfo = userMap.get(quotation.created_by)
        if (userInfo) {
          created_by_user = userInfo
        }
      }
      
      return {
        ...quotation,
        quotation_number: quotationNumber,
        contact,
        seller_user,
        created_by_user
      }
    })
    
    const total = count || 0
    const totalPages = Math.ceil(total / pageSize)
    
    return {
      quotations: formattedData,
      total,
      page,
      pageSize,
      totalPages
    }
    
  } catch (error) {
    console.error('Error inesperado obteniendo cotizaciones:', error)
    return {
      quotations: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0
    }
  }
}
export async function getQuotationById(
  quotationId: string
): Promise<Quotation | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("quotations")
      .select(
        `
        *,
        contact:contact_id (id, full_name, email, phone),
        company:company_id (id, name, rfc, street, colony, city, state, zip_code, address_number, phone, cellphone, website),
        price_list:price_list_id (id, name, code),
        items:quotations_details (
          *,
          product:product_id (
            id,
            name,
            description,
            measure_unit
          ),
          tax:tax_id (id, name, tax_type, rate, is_active, sat_tax_type)
        ),
        movements:quotation_movements_logs (
          id,
          movement_date,
          type,
          description,
          details,
          user_id
        )
        `
      )
      .eq("id", quotationId)
      .is("deleted_at", null)
      .single();

    if (error || !data) {
      console.error("Error obteniendo cotización:", error);
      return null;
    }
    
    // Filtrar items no eliminados
    if (data.items && Array.isArray(data.items)) {
      data.items = data.items.filter((item: any) => !item.deleted_at);
    }
    
    // Cargar los múltiples impuestos desde quotations_details_product_taxes
    if (data.items && Array.isArray(data.items) && data.items.length > 0) {
      const detailIds = data.items.map((item: any) => item.id);
      
      const { data: productTaxesData, error: productTaxesError } = await supabase
        .from('quotations_details_product_taxes')
        .select(`
          quotation_detail_id,
          tax_id,
          tax:tax_id (id, name, tax_type, rate, is_active, sat_tax_type)
        `)
        .in('quotation_detail_id', detailIds)
        .is('deleted_at', null);
      
      if (productTaxesError) {
        console.error('Error cargando impuestos de productos:', productTaxesError);
      } else if (productTaxesData && productTaxesData.length > 0) {
        // Agrupar taxes por quotation_detail_id
        const taxesByDetailId = new Map<string, any[]>();
        productTaxesData.forEach((pt: any) => {
          if (!taxesByDetailId.has(pt.quotation_detail_id)) {
            taxesByDetailId.set(pt.quotation_detail_id, []);
          }
          if (pt.tax) {
            taxesByDetailId.get(pt.quotation_detail_id)!.push(pt.tax);
          }
        });
        
        // Agregar los taxes a cada item
        data.items = data.items.map((item: any) => ({
          ...item,
          product_taxes: taxesByDetailId.get(item.id) || []
        }));
      }
    }
    
    // Si quieres obtener información del usuario creador, haz una consulta separada
    let created_by_user = null;

    if (data.created_by) {
      const { data: userData } = await supabase
        .from("users")
        .select("id, full_name, email")
        .eq("id", data.created_by)
        .single();

      if (userData) {
        created_by_user = userData;
      }
    }

    // 🔹 Movimientos con usuario incluido
    let movementsWithUsers: Quotation["movements"] = [];

    if (data.movements?.length) {
      const userIds = [
        ...new Set(
          data.movements
            .map((m: any) => m.user_id)
            .filter(Boolean)
        ),
      ];

      let usersMap: Record<string, any> = {};

      if (userIds.length > 0) {
        const { data: usersData } = await supabase
          .from("users")
          .select("id, full_name, email")
          .in("id", userIds);

        if (usersData) {
          usersMap = usersData.reduce((acc: any, user: any) => {
            acc[user.id] = user;
            return acc;
          }, {});
        }
      }

      movementsWithUsers = data.movements.map((movement: any) => ({
        ...movement,
        user: movement.user_id ? usersMap[movement.user_id] || null : null,
      }));
    }

    // 🔹 Formatear datos
    const formattedData: Quotation = {
      ...data,
      quotation_number: data.quotation_number
        ? data.quotation_number.toString()
        : null,
      contact: data.contact
        ? {
            ...data.contact,
            name: data.contact.full_name || "",
          }
        : undefined,
      created_by_user,
      movements: movementsWithUsers,
    };

    return formattedData;
  } catch (error) {
    console.error("Error inesperado obteniendo cotización:", error);
    return null;
  }
}
export async function addQuotationComment(
  quotationId: string,
  comment: string
) {
  if (!quotationId) throw new Error("Debe seleccionar una cotización válida.");
  if (!comment || comment.trim() === "") throw new Error("El comentario no puede estar vacío.");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");

  const now = new Date().toISOString();

  // ✅ Ajustamos el payload para no repetir el texto
  const payload = {
    quotation_id: quotationId,
    type: "comment", 
    movement_date: now,
    // 1. Cambiamos la descripción por un texto estático informativo
    description: "Nuevo comentario administrativo registrado", 
    // 2. El comentario real se queda solo aquí
    details: { note: comment.trim() }, 
    user_id: user.id,
    created_at: now,
    updated_at: now,
    last_comment: comment.trim()
  };

  try {
    const { error } = await supabase
      .from("quotation_movements_logs")
      .insert([payload]);

    if (error) throw error;

    return { success: true, message: "Comentario agregado correctamente ✅" };
  } catch (err: any) {
    console.error("Error guardando comentario:", err);
    return { success: false, message: `No se pudo guardar el comentario ❌\n${err.message || err}` };
  }
}



/**
 * Actualiza el estado de una cotización
 */
  export async function updateQuotationStatus(
    quotationId: string,
    status: Quotation['status'],
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = await createClient()
      const now = new Date().toISOString()

      // 1️⃣ Actualizar cotización
      const { error: updateError } = await supabase
        .from('quotations')
        .update({
          status,
          updated_by: userId,
          updated_at: now
        })
        .eq('id', quotationId)

      if (updateError) {
        console.error('Error actualizando cotización:', updateError)
        return { success: false, error: updateError.message }
      }
      // 4️⃣ Revalidar
      revalidatePath('/dashboard/cotizaciones')
      revalidatePath(`/dashboard/cotizaciones/${quotationId}`)

      return { success: true }

    } catch (error: any) {
      console.error('Error inesperado:', error)
      return { success: false, error: error?.message || 'Error inesperado del servidor' }
    }
  }
  




//*funcion para cancelar cotización (actualiza el estado a "cancelled") - REUTILIZA updateQuotationStatus
export async function cancelQuotation(
  quotationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    // 🔁 REUTILIZA EXACTAMENTE LO QUE YA EXISTE
    return await updateQuotationStatus(
      quotationId,
      'cancelled',
      user.id
    );
  } catch (error) {
    console.error('Error cancelando cotización:', error);
    return { success: false, error: 'Error inesperado del servidor' };
  }
}

/**
 * Elimina una cotización (soft delete)
 */
export async function deleteQuotation(
  quotationId: string
  //userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('quotations')
      .update({
        deleted_at: new Date().toISOString(),
        //deleted_by: UserId,
        updated_at: new Date().toISOString()
      })
      .eq('id', quotationId)
    
    if (error) {
      console.error('Error eliminando cotización:', error)
      return { success: false, error: 'Error al eliminar la cotización' }
    }
    
    revalidatePath('/dashboard/cotizaciones-padre/cotizaciones')
    return { success: true }
  } catch (error) {
    console.error('Error inesperado eliminando cotización:', error)
    return { success: false, error: 'Error inesperado del servidor' }
  }
}

/**
 * Duplica una cotización existente
 */
export async function duplicateQuotation(
  quotationId: string,
  userId: string
): Promise<{ success: boolean; newQuotationId?: string; error?: string }> {
  try {
    const supabase = await createClient()
    
    // Obtener la cotización original
    const original = await getQuotationById(quotationId)
    
    if (!original) {
      return { success: false, error: 'Cotización no encontrada' }
    }
    
    // Generar nuevo número de cotización
    const newQuotationNumber = await generateQuotationNumber()
    
    // Crear nueva cotización basada en la original
    const { data: newQuotation, error: quotationError } = await supabase
      .from('quotations')
      .insert({
        quotation_number: newQuotationNumber,
        contact_id: original.contact_id,
        company_id: original.company_id,
        price_list_id: original.price_list_id,
        inventory_location_id: original.inventory_location_id,
        subtotal: original.subtotal,
        discount_type: original.discount_type,
        discount_value: original.discount_value,
        discount_amount: original.discount_amount,
        total: original.total,
        valid_from: original.valid_from,
        valid_until: original.valid_until,
        customer_note: original.customer_note,
        status: 'pending',
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single()
    
    if (quotationError) {
      console.error('Error duplicando cotización:', quotationError)
      return { success: false, error: 'Error al duplicar la cotización' }
    }
    
    // Duplicar los items si existen
    if (original.items && original.items.length > 0) {
      const newItems = original.items.map(item => ({
        quotation_id: newQuotation.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        item_subtotal: item.item_subtotal,
        item_total: item.item_total,
        notes: item.notes,
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))
      
      const { error: itemsError } = await supabase
        .from('quotations_details')
        .insert(newItems)
      
      if (itemsError) {
        console.error('Error duplicando items:', itemsError)
        
        // Eliminar la cotización creada si fallan los items
        await supabase
          .from('quotations')
          .delete()
          .eq('id', newQuotation.id)
        
        return { success: false, error: 'Error al duplicar los productos' }
      }
    }
    
    revalidatePath('/dashboard/cotizaciones')
    return { success: true, newQuotationId: newQuotation.id }
    
  } catch (error) {
    console.error('Error inesperado duplicando cotización:', error)
    return { success: false, error: 'Error inesperado del servidor' }
  }
}

/**
 * Convierte una cotización en orden de venta
 */
export async function convertToOrder(
  quotationId: string,
  userId: string
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  try {
    const supabase = await createClient()
    
    // Obtener la cotización con sus detalles
    const quotation = await getQuotationById(quotationId)
    
    if (!quotation) {
      return { success: false, error: 'Cotización no encontrada' }
    }
    
    if (quotation.status === 'converted_to_order') {
      return { success: false, error: 'Esta cotización ya fue convertida en orden' }
    }
    
    // Aquí iría la lógica para crear una orden de venta
    // Por ahora solo actualizamos el estado
    const { error } = await supabase
      .from('quotations')
      .update({
        status: 'converted_to_order',
        updated_by: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', quotationId)
    
    if (error) {
      console.error('Error convirtiendo a orden:', error)
      return { success: false, error: 'Error al convertir en orden' }
    }
    
    revalidatePath('/dashboard/cotizaciones')
    return { success: true }
    
  } catch (error) {
    console.error('Error inesperado convirtiendo a orden:', error)
    return { success: false, error: 'Error inesperado del servidor' }
  }
}

/**
 * Obtiene estadísticas de cotizaciones
 */
export async function getQuotationStats(
  companyId?: string,
  startDate?: string,
  endDate?: string
): Promise<{
  total: number
  pending: number
  sent: number
  accepted: number
  rejected: number
  expired: number
  converted: number
  totalAmount: number
}> {
  try {
    const supabase = await createClient()
    
    let query = supabase
      .from('quotations')
      .select('status, total', { count: 'exact' })
      .is('deleted_at', null)
    
    if (companyId) {
      query = query.eq('company_id', companyId)
    }
    
    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    
    if (endDate) {
      query = query.lte('created_at', endDate)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error obteniendo estadísticas:', error)
      return {
        total: 0,
        pending: 0,
        sent: 0,
        accepted: 0,
        rejected: 0,
        expired: 0,
        converted: 0,
        totalAmount: 0
      }
    }
    
    const stats = {
      total: data?.length || 0,
      pending: data?.filter(q => q.status === 'pending').length || 0,
      sent: data?.filter(q => q.status === 'sent').length || 0,
      accepted: data?.filter(q => q.status === 'accepted').length || 0,
      rejected: data?.filter(q => q.status === 'rejected').length || 0,
      expired: data?.filter(q => q.status === 'expired').length || 0,
      converted: data?.filter(q => q.status === 'converted_to_order').length || 0,
      totalAmount: data?.reduce((sum, q) => sum + (q.total || 0), 0) || 0
    }
    
    return stats
    
  } catch (error) {
    console.error('Error inesperado obteniendo estadísticas:', error)
    return {
      total: 0,
      pending: 0,
      sent: 0,
      accepted: 0,
      rejected: 0,
      expired: 0,
      converted: 0,
      totalAmount: 0
    }
  }
}

/**
 * Exporta cotizaciones a PDF (placeholder)
 */
export async function exportQuotationToPdf(
  quotationId: string
): Promise<{ success: boolean; pdfUrl?: string; error?: string }> {
  // Aquí iría la lógica para generar el PDF
  // Por ahora devolvemos un placeholder
  return {
    success: true,
    pdfUrl: `/api/quotations/${quotationId}/export`
  }
}

/**
 * Envía cotización por email
 */
export async function sendQuotationByEmail(
  quotationId: string,
  email: string,
  message?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Aquí iría la lógica para enviar el email
    // Por ahora simulamos el envío
    
    // Actualizar estado a 'sent'
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('quotations')
      .update({
        status: 'sent',
        updated_at: new Date().toISOString()
      })
      .eq('id', quotationId)
    
    if (error) {
      console.error('Error actualizando estado al enviar:', error)
    }
    
    return { success: true }
    
  } catch (error) {
    console.error('Error enviando cotización:', error)
    return { success: false, error: 'Error al enviar la cotización' }
  }
}

// ============================================================
// FUNCIONES PARA MANEJAR MÚLTIPLES IMPUESTOS POR PRODUCTO
// (quotations_details_product_taxes)
// ============================================================

/**
 * Asigna múltiples impuestos a un detalle de cotización
 * @param quotationDetailId - ID del detalle de cotización
 * @param tax_ids - Array de IDs de impuestos a asignar
 * @param userId - ID del usuario que realiza la operación
 */
export async function assignTaxesToQuotationDetail({
  quotationDetailId,
  tax_ids,
  userId,
}: {
  quotationDetailId: string;
  tax_ids: string[];
  userId: string;
}): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = await createClient();

    // Validar que el detalle de cotización existe
    const { data: detail, error: detailError } = await supabase
      .from('quotations_details')
      .select('id')
      .eq('id', quotationDetailId)
      .is('deleted_at', null)
      .maybeSingle();

    if (detailError || !detail) {
      return {
        success: false,
        message: 'El detalle de cotización no existe',
      };
    }

    // Si no hay impuestos que asignar, terminar
    if (tax_ids.length === 0) {
      return { success: true };
    }

    // Validar que los impuestos existen
    const { data: validTaxes, error: taxesError } = await supabase
      .from('taxes')
      .select('id')
      .in('id', tax_ids)
      .is('deleted_at', null);

    if (taxesError) {
      return {
        success: false,
        message: 'Error al validar impuestos',
      };
    }

    if (validTaxes.length !== tax_ids.length) {
      return {
        success: false,
        message: 'Algunos impuestos no existen o están inactivos',
      };
    }

    // Crear los registros en la tabla de relación
    const records = tax_ids.map((tax_id) => ({
      quotation_detail_id: quotationDetailId,
      tax_id: tax_id,
      created_by: userId,
      created_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabase
      .from('quotations_details_product_taxes')
      .insert(records);

    if (insertError) {
      console.error('Error asignando impuestos:', insertError);
      return {
        success: false,
        message: 'Error al asignar impuestos al detalle',
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error inesperado asignando impuestos:', error);
    return {
      success: false,
      message: error.message || 'Error inesperado',
    };
  }
}

/**
 * Actualiza los impuestos de un detalle de cotización (reemplaza todos)
 * @param quotationDetailId - ID del detalle de cotización
 * @param tax_ids - Array de IDs de impuestos nuevos
 * @param userId - ID del usuario que realiza la operación
 */
export async function updateQuotationDetailTaxes({
  quotationDetailId,
  tax_ids,
  userId,
}: {
  quotationDetailId: string;
  tax_ids: string[];
  userId: string;
}): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = await createClient();

    // Validar que el detalle de cotización existe
    const { data: detail, error: detailError } = await supabase
      .from('quotations_details')
      .select('id')
      .eq('id', quotationDetailId)
      .is('deleted_at', null)
      .maybeSingle();

    if (detailError || !detail) {
      return {
        success: false,
        message: 'El detalle de cotización no existe',
      };
    }

    // Hacer soft delete de los impuestos actuales
    const { error: softDeleteError } = await supabase
      .from('quotations_details_product_taxes')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: userId,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      })
      .eq('quotation_detail_id', quotationDetailId)
      .is('deleted_at', null);

    if (softDeleteError) {
      console.error('Error eliminando impuestos anteriores:', softDeleteError);
      return {
        success: false,
        message: 'Error al actualizar impuestos',
      };
    }

    // Si no hay nuevos impuestos que asignar, terminar aquí
    if (tax_ids.length === 0) {
      return { success: true };
    }

    // Validar que los nuevos impuestos existen
    const { data: validTaxes, error: taxesError } = await supabase
      .from('taxes')
      .select('id')
      .in('id', tax_ids)
      .is('deleted_at', null);

    if (taxesError) {
      return {
        success: false,
        message: 'Error al validar impuestos',
      };
    }

    if (validTaxes.length !== tax_ids.length) {
      return {
        success: false,
        message: 'Algunos impuestos no existen o están inactivos',
      };
    }

    // Insertar los nuevos registros
    const records = tax_ids.map((tax_id) => ({
      quotation_detail_id: quotationDetailId,
      tax_id: tax_id,
      created_by: userId,
      created_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabase
      .from('quotations_details_product_taxes')
      .insert(records);

    if (insertError) {
      console.error('Error insertando nuevos impuestos:', insertError);
      return {
        success: false,
        message: 'Error al asignar nuevos impuestos',
      };
    }

    revalidatePath('/dashboard/cotizaciones-padre');
    return { success: true };
  } catch (error: any) {
    console.error('Error inesperado actualizando impuestos:', error);
    return {
      success: false,
      message: error.message || 'Error inesperado',
    };
  }
}

/**
 * Obtiene todos los impuestos asignados a un detalle de cotización
 * @param quotationDetailId - ID del detalle de cotización
 * @returns Array de impuestos con información completa
 */
export async function getQuotationDetailTaxes(
  quotationDetailId: string
): Promise<
  Array<{
    id: string;
    quotation_detail_id: string;
    tax_id: string;
    created_at: string;
    created_by: string | null;
    tax: {
      id: string;
      name: string;
      description: string | null;
      tax_type: 'percentage' | 'fixed_amount';
      rate: number;
      is_active: boolean;
      sat_tax_type: 'iva' | 'isr' | 'ieps' | 'local';
    };
  }>
> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('quotations_details_product_taxes')
      .select(
        `
        id,
        quotation_detail_id,
        tax_id,
        created_at,
        created_by,
        taxes!inner (
          id,
          name,
          description,
          tax_type,
          rate,
          is_active,
          sat_tax_type
        )
      `
      )
      .eq('quotation_detail_id', quotationDetailId)
      .is('deleted_at', null)
      .is('taxes.deleted_at', null);

    if (error) {
      console.error('Error obteniendo impuestos del detalle:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      quotation_detail_id: item.quotation_detail_id,
      tax_id: item.tax_id,
      created_at: item.created_at,
      created_by: item.created_by,
      tax: item.taxes,
    }));
  } catch (error) {
    console.error('Error inesperado obteniendo impuestos:', error);
    return [];
  }
}

/**
 * Elimina (soft delete) todos los impuestos de un detalle de cotización
 * @param quotationDetailId - ID del detalle de cotización
 * @param userId - ID del usuario que realiza la operación
 */
export async function removeQuotationDetailTaxes({
  quotationDetailId,
  userId,
}: {
  quotationDetailId: string;
  userId: string;
}): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('quotations_details_product_taxes')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: userId,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      })
      .eq('quotation_detail_id', quotationDetailId)
      .is('deleted_at', null);

    if (error) {
      console.error('Error eliminando impuestos del detalle:', error);
      return {
        success: false,
        message: 'Error al eliminar impuestos del detalle',
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error inesperado eliminando impuestos:', error);
    return {
      success: false,
      message: error.message || 'Error inesperado',
    };
  }
}
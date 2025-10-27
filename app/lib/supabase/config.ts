import { supabase } from './client'

// Funciones de configuración inicial
export const initializeDatabase = async () => {
  // Verificar conexión
  const { data, error } = await supabase.from('tables').select('count')
  
  if (error) {
    console.error('Error conectando a Supabase:', error)
    return false
  }
  
  console.log('✅ Conexión a Supabase establecida')
  return true
}

// Datos de ejemplo para desarrollo
export const seedInitialData = async () => {
  // Insertar mesas si no existen
  const { data: tables } = await supabase.from('tables').select('*')
  
  if (!tables || tables.length === 0) {
    const tablesData = Array.from({ length: 15 }, (_, i) => ({
      number: i + 1,
      status: 'available' as const,
      capacity: 4,
      location: i < 5 ? 'interior' : i < 10 ? 'terraza' : 'vip'
    }))

    await supabase.from('tables').insert(tablesData)
    console.log('✅ Mesas creadas')
  }

  // Insertar productos si no existen
  const { data: products } = await supabase.from('products').select('*')
  
  if (!products || products.length === 0) {
    const productsData = [
      // Breakfast
      { name: 'Pancake Breakfast', description: 'Fluffy pancakes with syrup', price: 6.5, category: 'Breakfast', preparation_time: 10 },
      { name: 'Breakfast Combo', description: 'Complete breakfast set', price: 8.99, category: 'Breakfast', preparation_time: 15 },
      
      // Lunch
      { name: 'Chicken Bowl', description: 'Grilled chicken with rice and vegetables', price: 12.99, category: 'Lunch', preparation_time: 20 },
      { name: 'Business Lunch', description: 'Professional lunch option', price: 15.5, category: 'Lunch', preparation_time: 25 },
      { name: 'Veggie Wrap', description: 'Fresh vegetable wrap', price: 7.99, category: 'Lunch', preparation_time: 10 },
      
      // Dinner
      { name: 'Beef Burger', description: 'Juicy beef burger with cheese and veggies', price: 9.5, category: 'Dinner', preparation_time: 15 },
      { name: 'Steak Dinner', description: 'Premium steak dinner', price: 18.75, category: 'Dinner', preparation_time: 30 },
      
      // Combos
      { name: 'Family Combo', description: 'Perfect for family dinner', price: 24.99, category: 'Combos', preparation_time: 35 },
      
      // Refill
      { name: 'Soda Refill', description: 'Refill your favorite soda', price: 1.0, category: 'Refill', preparation_time: 2 },
      { name: 'Coffee Refill', description: 'Hot coffee refill', price: 1.5, category: 'Refill', preparation_time: 3 }
    ]

    await supabase.from('products').insert(productsData)
    console.log('✅ Productos creados')
  }
}
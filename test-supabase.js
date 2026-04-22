// Script de prueba para verificar conexión con Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://irakfezigymxnwjesxyu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyYWtmZXppZ3lteG53amVzY3l1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MzEyMjQsImV4cCI6MjA5MjQwNzIyNH0.rLJGOrCKd9bXv6CXef81FEWVhGstSIj8nglGLWJK8ok';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('🔍 Probando conexión con Supabase...\n');
  
  try {
    // Verificar si la tabla profiles existe
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profilesError) {
      console.log('❌ Tabla "profiles" no existe o hay un error:');
      console.log('   Error:', profilesError.message);
      console.log('\n⚠️  NECESITAS CREAR LAS TABLAS');
      console.log('   Ve a Supabase → SQL Editor y ejecuta el SQL de SUPABASE_SETUP.md\n');
      return false;
    }
    
    console.log('✅ Tabla "profiles" existe');
    
    // Verificar si la tabla analysis_history existe
    const { data: history, error: historyError } = await supabase
      .from('analysis_history')
      .select('*')
      .limit(1);
    
    if (historyError) {
      console.log('❌ Tabla "analysis_history" no existe o hay un error:');
      console.log('   Error:', historyError.message);
      console.log('\n⚠️  NECESITAS CREAR LAS TABLAS');
      console.log('   Ve a Supabase → SQL Editor y ejecuta el SQL de SUPABASE_SETUP.md\n');
      return false;
    }
    
    console.log('✅ Tabla "analysis_history" existe');
    console.log('\n🎉 ¡TODO ESTÁ CONFIGURADO CORRECTAMENTE!\n');
    console.log('Próximos pasos:');
    console.log('1. npm run dev (para probar localmente)');
    console.log('2. Crear una cuenta de prueba');
    console.log('3. Analizar un gráfico');
    console.log('4. Verificar que se guarde en el historial\n');
    
    return true;
  } catch (error) {
    console.log('❌ Error de conexión:', error.message);
    console.log('\n⚠️  Verifica que las API keys sean correctas\n');
    return false;
  }
}

testConnection();

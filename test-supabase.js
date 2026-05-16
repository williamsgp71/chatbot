import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testConnection() {
  console.log('--- Probando conexión a Supabase ---');
  console.log('URL:', process.env.SUPABASE_URL);

  // 1. Intentar listar tablas (vía RPC o consulta directa si es posible, 
  // pero lo más sencillo es intentar un select de la tabla conflictiva)
  console.log('\n1. Verificando tabla "conversations"...');
  const { data: convData, error: convError } = await supabase
    .from('conversations')
    .select('*')
    .limit(1);

  if (convError) {
    console.error('❌ Error al acceder a "conversations":', convError.code, convError.message);
    if (convError.code === 'PGRST204' || convError.code === 'PGRST205') {
        console.error('👉 CONCLUSIÓN: La tabla NO existe o no está en el esquema público.');
    }
  } else {
    console.log('✅ Tabla "conversations" accesible.');
  }

  console.log('\n2. Verificando tabla "messages"...');
  const { data: msgData, error: msgError } = await supabase
    .from('messages')
    .select('*')
    .limit(1);

  if (msgError) {
    console.error('❌ Error al acceder a "messages":', msgError.code, msgError.message);
  } else {
    console.log('✅ Tabla "messages" accesible.');
  }

  console.log('\n--- Fin de la prueba ---');
}

testConnection();

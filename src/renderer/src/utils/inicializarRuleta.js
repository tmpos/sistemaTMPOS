/**
 * Script de inicialización para las tablas de la ruleta
 * Este script crea las tablas necesarias para el sistema de ruleta de premios
 */

export async function inicializarTablasRuleta() {
  try {
    console.log('🎡 Inicializando tablas de la ruleta...')

    // Crear tabla de premios
    await window.electron.ipcRenderer.invoke(
      'consultaservidor',
      'crearTabla',
      'premios_ruleta',
      'id,nombre,descripcion,tipo,imagen,color,probabilidad,activo,created_at,updated_at'
    )
    console.log('✅ Tabla premios_ruleta creada')

    // Crear tabla de ganadores
    await window.electron.ipcRenderer.invoke(
      'consultaservidor',
      'crearTabla',
      'ganadores_ruleta',
      'id,no_factura,nombre_cliente,almacen,premio_ganado,premio_id,fecha_participacion,hora_participacion,created_at,updated_at'
    )
    console.log('✅ Tabla ganadores_ruleta creada')

    console.log('✅ Índices creados (automáticamente por el sistema)')

    // Verificar si ya hay premios
    const premiosExistentes = await window.electron.ipcRenderer.invoke(
      'consultaservidor',
      'getDataAsArray',
      'premios_ruleta'
    )

    if (!premiosExistentes || premiosExistentes.length === 0) {
      // Insertar premios de ejemplo
      const premiosEjemplo = [
        {
          nombre: 'Descuento 10%',
          descripcion: 'Obtén un 10% de descuento en tu próxima compra',
          tipo: 'premio',
          color: '#FF6384',
          probabilidad: 12,
          activo: 1,
          created_at: Date.now(),
          updated_at: Date.now()
        },
        {
          nombre: 'Producto Gratis',
          descripcion: 'Un producto gratis de nuestra selección',
          tipo: 'premio',
          color: '#36A2EB',
          probabilidad: 8,
          activo: 1,
          created_at: Date.now(),
          updated_at: Date.now()
        },
        {
          nombre: 'Gira de Nuevo',
          descripcion: '¡Tienes otra oportunidad! Vuelve a girar la ruleta',
          tipo: 'comodin',
          color: '#4facfe',
          probabilidad: 10,
          activo: 1,
          created_at: Date.now(),
          updated_at: Date.now()
        },
        {
          nombre: 'Vale $100',
          descripcion: 'Vale de $100 para tu próxima compra',
          tipo: 'premio',
          color: '#4BC0C0',
          probabilidad: 5,
          activo: 1,
          created_at: Date.now(),
          updated_at: Date.now()
        },
        {
          nombre: 'Sigue Participando',
          descripcion: 'Gracias por participar. ¡La próxima será!',
          tipo: 'mensaje',
          color: '#FFA726',
          probabilidad: 15,
          activo: 1,
          created_at: Date.now(),
          updated_at: Date.now()
        },
        {
          nombre: 'Premio Especial',
          descripcion: 'Premio sorpresa especial',
          tipo: 'premio',
          color: '#9966FF',
          probabilidad: 3,
          activo: 1,
          created_at: Date.now(),
          updated_at: Date.now()
        }
      ]

      for (const premio of premiosEjemplo) {
        await window.electron.ipcRenderer.invoke(
          'consultaservidor',
          'insertData',
          'premios_ruleta',
          JSON.stringify(premio)
        )
      }
      console.log('✅ Premios de ejemplo insertados')
    } else {
      console.log('ℹ️  Ya existen premios en la base de datos')
    }

    console.log('🎉 Inicialización de la ruleta completada exitosamente')
    return { success: true, message: 'Tablas de ruleta inicializadas correctamente' }
  } catch (error) {
    console.error('❌ Error al inicializar tablas de la ruleta:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Función para verificar si las tablas de la ruleta existen
 */
export async function verificarTablasRuleta() {
  try {
    let premiosExiste = false
    let ganadoresExiste = false

    // Verificar tabla premios_ruleta
    try {
      const premios = await window.electron.ipcRenderer.invoke(
        'consultaservidor',
        'tableExists',
        'premios_ruleta'
      )
      premiosExiste = Array.isArray(premios) && premios[0] === 'ok'

      // Verificación alternativa: intentar leer datos
      if (!premiosExiste) {
        try {
          await window.electron.ipcRenderer.invoke(
            'consultaservidor',
            'getDataAsArray',
            'premios_ruleta'
          )
          premiosExiste = true
        } catch (e) {
          premiosExiste = false
        }
      }
    } catch (e) {
      console.log('Tabla premios_ruleta no existe:', e.message)
      premiosExiste = false
    }

    // Verificar tabla ganadores_ruleta
    try {
      const ganadores = await window.electron.ipcRenderer.invoke(
        'consultaservidor',
        'tableExists',
        'ganadores_ruleta'
      )
      ganadoresExiste = Array.isArray(ganadores) && ganadores[0] === 'ok'

      // Verificación alternativa: intentar leer datos
      if (!ganadoresExiste) {
        try {
          await window.electron.ipcRenderer.invoke(
            'consultaservidor',
            'getDataAsArray',
            'ganadores_ruleta'
          )
          ganadoresExiste = true
        } catch (e) {
          ganadoresExiste = false
        }
      }
    } catch (e) {
      console.log('Tabla ganadores_ruleta no existe:', e.message)
      ganadoresExiste = false
    }

    return {
      premiosExiste,
      ganadoresExiste
    }
  } catch (error) {
    console.error('Error al verificar tablas:', error)
    return { premiosExiste: false, ganadoresExiste: false }
  }
}

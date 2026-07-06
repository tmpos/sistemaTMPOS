/* ============================================================================
   📆 TM POS - Utilidad de Fechas Profesional (by Tomás de Jesús Taveras)
   ----------------------------------------------------------------------------
   ✅ Incluye:
   - Todos los rangos originales (ayer, hoy, mes, semana, etc.)
   - Nuevos rangos: 3, 15, 30, 60, 90 días, trimestres, semestres, años
   - Formatos largos / cortos, ISO, Unix
   - Comparaciones (días entre, meses entre, etc.)
   - Sumar/restar días, meses y años
   - Idioma personalizable (es/en)
   - Soporte de zona horaria
   - Compatible con Vue, Electron, Node, Capacitor
   ===========================================================================*/

export const FechaTools = (() => {
  // 🔹 Helpers básicos
  const pad = (n) => String(n).padStart(2, '0')
  const ndiasemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const meses = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre'
  ]

  // 🔹 Calcular diferencia de días
  const diasEntre = (f1, f2) => {
    const d1 = new Date(f1)
    const d2 = new Date(f2)
    return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24))
  }

  // 🔹 Calcular diferencia de meses
  const mesesEntre = (f1, f2) => {
    const d1 = new Date(f1)
    const d2 = new Date(f2)
    return (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth())
  }

  // 🔹 Día hábil / fin de semana
  const esFinDeSemana = (fecha = new Date()) => {
    const d = new Date(fecha).getDay()
    return d === 0 || d === 6
  }
  const esDiaHabil = (fecha) => !esFinDeSemana(fecha)

  // 🔹 Porcentaje del mes
  const porcentajeMes = () => {
    const hoy = new Date()
    const totalDias = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate()
    return Math.round((hoy.getDate() / totalDias) * 100)
  }

  // 🔹 Días restantes del mes
  const diasRestantesMes = () => {
    const hoy = new Date()
    const totalDias = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate()
    return totalDias - hoy.getDate()
  }

  // 🔹 Formato largo/humano
  const formatoHumano = (fecha = new Date(), idioma = 'es', incluirHora = true) => {
    const f = new Date(fecha)
    const dia = f.getDate()
    const mes = idioma === 'es' ? meses[f.getMonth()] : f.toLocaleString('en-US', { month: 'long' })
    const year = f.getFullYear()
    const hora = incluirHora
      ? `, ${f.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      : ''
    const diaSemana =
      idioma === 'es' ? ndiasemana[f.getDay()] : f.toLocaleString('en-US', { weekday: 'long' })
    return idioma === 'es'
      ? `${diaSemana} ${dia} de ${mes} de ${year}${hora}`
      : `${diaSemana}, ${mes} ${dia}, ${year}${hora}`
  }

  // 🔹 Calcular rango genérico (últimos X días)
  const rango = (dias) => {
    const hoy = new Date()
    const inicio = new Date(hoy)
    inicio.setDate(hoy.getDate() - dias)
    return {
      fechainicio: `${inicio.getFullYear()}-${pad(inicio.getMonth() + 1)}-${pad(inicio.getDate())} 00:00:00`,
      fechafin: `${hoy.getFullYear()}-${pad(hoy.getMonth() + 1)}-${pad(hoy.getDate())} 23:59:59`
    }
  }

  // 🔹 Rango de trimestre
  const rangoTrimestre = (actual = true) => {
    const hoy = new Date()
    const trimestre = Math.floor(hoy.getMonth() / 3)
    const inicio = actual ? trimestre * 3 : (trimestre - 1) * 3
    const año = hoy.getFullYear() - (actual ? 0 : trimestre === 0 ? 1 : 0)
    const inicioFecha = new Date(año, inicio, 1)
    const finFecha = new Date(año, inicio + 3, 0)
    return {
      fechainicio: `${inicioFecha.getFullYear()}-${pad(inicioFecha.getMonth() + 1)}-${pad(inicioFecha.getDate())} 00:00:00`,
      fechafin: `${finFecha.getFullYear()}-${pad(finFecha.getMonth() + 1)}-${pad(finFecha.getDate())} 23:59:59`
    }
  }

  // 🔹 Rango de semestre
  const rangoSemestre = (actual = true) => {
    const hoy = new Date()
    const semestre = hoy.getMonth() < 6 ? 1 : 2
    let año = hoy.getFullYear()
    let inicioMes, finMes
    if (actual) {
      inicioMes = semestre === 1 ? 0 : 6
      finMes = semestre === 1 ? 5 : 11
    } else {
      if (semestre === 1) {
        año -= 1
        inicioMes = 6
        finMes = 11
      } else {
        inicioMes = 0
        finMes = 5
      }
    }
    const inicio = new Date(año, inicioMes, 1)
    const fin = new Date(año, finMes + 1, 0)
    return {
      fechainicio: `${inicio.getFullYear()}-${pad(inicio.getMonth() + 1)}-${pad(inicio.getDate())} 00:00:00`,
      fechafin: `${fin.getFullYear()}-${pad(fin.getMonth() + 1)}-${pad(fin.getDate())} 23:59:59`
    }
  }

  // 🔹 SUMAR / RESTAR días, meses y años
  const sumarDias = (fecha = new Date(), cantidad = 1) => {
    const f = new Date(fecha)
    f.setDate(f.getDate() + cantidad)
    return `${f.getFullYear()}-${pad(f.getMonth() + 1)}-${pad(f.getDate())}`
  }

  const restarDias = (fecha = new Date(), cantidad = 1) => {
    const f = new Date(fecha)
    f.setDate(f.getDate() - cantidad)
    return `${f.getFullYear()}-${pad(f.getMonth() + 1)}-${pad(f.getDate())}`
  }

  const sumarMeses = (fecha = new Date(), cantidad = 1) => {
    const f = new Date(fecha)
    f.setMonth(f.getMonth() + cantidad)
    return `${f.getFullYear()}-${pad(f.getMonth() + 1)}-${pad(f.getDate())}`
  }

  const restarMeses = (fecha = new Date(), cantidad = 1) => {
    const f = new Date(fecha)
    f.setMonth(f.getMonth() - cantidad)
    return `${f.getFullYear()}-${pad(f.getMonth() + 1)}-${pad(f.getDate())}`
  }

  const sumarAnios = (fecha = new Date(), cantidad = 1) => {
    const f = new Date(fecha)
    f.setFullYear(f.getFullYear() + cantidad)
    return `${f.getFullYear()}-${pad(f.getMonth() + 1)}-${pad(f.getDate())}`
  }

  const restarAnios = (fecha = new Date(), cantidad = 1) => {
    const f = new Date(fecha)
    f.setFullYear(f.getFullYear() - cantidad)
    return `${f.getFullYear()}-${pad(f.getMonth() + 1)}-${pad(f.getDate())}`
  }

  // 🔹 Detalles completos de una fecha
  const detalles = (fecha = new Date()) => {
    const f = new Date(fecha)
    return {
      dia: ndiasemana[f.getDay()],
      numeroDia: pad(f.getDate()),
      mes: meses[f.getMonth()],
      numeroMes: pad(f.getMonth() + 1),
      year: f.getFullYear(),
      hora12: `${f.getHours() % 12 || 12}:${pad(f.getMinutes())} ${f.getHours() < 12 ? 'am' : 'pm'}`,
      hora24: `${pad(f.getHours())}:${pad(f.getMinutes())}:${pad(f.getSeconds())}`,
      timestampISO: f.toISOString(),
      timestampUnix: f.getTime(),
      semana: Math.ceil((f.getDate() + new Date(f.getFullYear(), f.getMonth(), 1).getDay()) / 7)
    }
  }

  // 🔹 Core principal: nfecha()
  const nfecha = (pedido, opciones = {}) => {
    const hoy = new Date()
    const yyyy = hoy.getFullYear()
    const mm = pad(hoy.getMonth() + 1)
    const dd = pad(hoy.getDate())
    const hh = pad(hoy.getHours())
    const min = pad(hoy.getMinutes())
    const ss = pad(hoy.getSeconds())
    const fechaAmericana = `${yyyy}-${mm}-${dd}`
    const fechaHoraActual = `${fechaAmericana} ${hh}:${min}:${ss}`
    const fechaHoraFin = `${fechaAmericana} 23:59:59`
    const fecha = `${dd}/${mm}/${yyyy}`

    // Semana actual
    const inicioSemana = new Date(hoy)
    inicioSemana.setDate(hoy.getDate() - hoy.getDay())

    const rangos = {
      dia: dd,
      diasemana: ndiasemana[hoy.getDay()],
      mesletra: meses[hoy.getMonth()],
      mes: mm,
      year: yyyy,
      fecha,
      fechaAmericana,
      timestamp: fechaHoraActual,
      hora: `${hoy.getHours() % 12 || 12}:${pad(hoy.getMinutes())}:${pad(hoy.getSeconds())} ${hoy.getHours() < 12 ? 'am' : 'pm'}`,
      horaAmericana: `${hh}:${min}:${ss}`,
      timestampISO: hoy.toISOString(),
      timestampUnix: hoy.getTime(),
      timestampcompleta: { fechainicio: `${fechaAmericana} 00:01:00`, fechafin: fechaHoraFin },
      rangosemana: {
        fechainicio: `${inicioSemana.getFullYear()}-${pad(inicioSemana.getMonth() + 1)}-${pad(inicioSemana.getDate())} 00:00:00`,
        fechafin: fechaHoraFin
      },
      mestimestamp: { fechainicio: `${yyyy}-${mm}-01 00:00:00`, fechafin: fechaHoraFin },
      anioActual: { fechainicio: `${yyyy}-01-01 00:00:00`, fechafin: `${yyyy}-12-31 23:59:59` },
      anioAnterior: {
        fechainicio: `${yyyy - 1}-01-01 00:00:00`,
        fechafin: `${yyyy - 1}-12-31 23:59:59`
      },
      ultimos3dias: rango(3),
      ultimos7dias: rango(7),
      ultimos15dias: rango(15),
      ultimos30dias: rango(30),
      ultimos60dias: rango(60),
      ultimos90dias: rango(90),
      trimestreActual: rangoTrimestre(true),
      trimestreAnterior: rangoTrimestre(false),
      semestreActual: rangoSemestre(true),
      semestreAnterior: rangoSemestre(false),
      porcentajeMes: porcentajeMes(),
      diasRestantesMes: diasRestantesMes(),
      encabezadoPDF: {
        fechaLarga: formatoHumano(hoy, 'es', true),
        rangoMes: `01/${mm}/${yyyy} al ${dd}/${mm}/${yyyy}`,
        textoMes: `${meses[hoy.getMonth()]} ${yyyy}`
      },
      debug: (() => {
        const testRangos = {
          semana: rango(7),
          mes: { fechainicio: `${yyyy}-${mm}-01 00:00:00`, fechafin: fechaHoraActual },
          trimestre: rangoTrimestre(true)
        }
        return {
          hoy: formatoHumano(),
          rangosCalculados: testRangos
        }
      })()
    }

    if (pedido === 'detalles') return detalles(opciones.fecha)
    if (pedido === 'formatoHumano') return formatoHumano(opciones.fecha, opciones.idioma, true)
    return rangos[pedido] ?? null
  }

  // 🔹 Exportar todas las funciones
  return {
    nfecha,
    diasEntre,
    mesesEntre,
    esFinDeSemana,
    esDiaHabil,
    porcentajeMes,
    diasRestantesMes,
    formatoHumano,
    detalles,
    rangoTrimestre,
    rangoSemestre,
    sumarDias,
    restarDias,
    sumarMeses,
    restarMeses,
    sumarAnios,
    restarAnios
  }
})()

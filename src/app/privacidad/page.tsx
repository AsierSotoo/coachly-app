import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidad',
  description: 'Cómo Coachly trata tus datos personales.',
}

export default function PrivacidadPage() {
  return (
    <div style={{ backgroundColor: '#0b1310', minHeight: '100vh', color: '#edf2ee', fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <header style={{ borderBottom: '1px solid #2e4538', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
            <Image src="/logo.png" alt="Coachly" width={32} height={32} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <span style={{ fontWeight: 800, fontSize: 17, color: '#edf2ee', fontFamily: 'Sora, sans-serif' }}>
            Coach<span style={{ color: '#72e697' }}>ly</span>
          </span>
        </Link>
        <span style={{ color: '#2e4538' }}>·</span>
        <Link href="/register" style={{ fontSize: 13, color: '#72e697', textDecoration: 'none' }}>← Volver al registro</Link>
      </header>

      {/* Content */}
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 96px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#72e697', marginBottom: 12 }}>
          Legal
        </p>
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 8px', fontFamily: 'Sora, sans-serif', letterSpacing: '-0.02em' }}>
          Política de Privacidad
        </h1>
        <p style={{ fontSize: 13, color: '#637168', marginBottom: 48 }}>Última actualización: septiembre de 2026</p>

        <Section title="1. Responsable del tratamiento">
          <p>El responsable del tratamiento de los datos personales recogidos a través de Coachly es:</p>
          <ul>
            <li><strong>Nombre:</strong> Asier Soto</li>
            <li><strong>Contacto:</strong> asiersoto1001@gmail.com</li>
          </ul>
        </Section>

        <Section title="2. Datos que recogemos">
          <p>Al registrarte y usar Coachly, recogemos los siguientes datos:</p>
          <ul>
            <li><strong>Datos de cuenta:</strong> nombre y dirección de correo electrónico.</li>
            <li><strong>Datos del equipo:</strong> nombre del equipo, categoría, logos y plantilla de jugadoras (nombres, dorsales y posiciones).</li>
            <li><strong>Datos de actividad deportiva:</strong> resultados de partidos, estadísticas individuales (goles, asistencias, tarjetas y minutos jugados), convocatorias y notas tácticas.</li>
            <li><strong>Datos técnicos:</strong> dirección IP, tipo de navegador y preferencias de la aplicación (tema visual, idioma), almacenados de forma anónima.</li>
          </ul>
          <p>No recogemos datos de pago, datos sensibles ni datos de menores de forma directa. Las jugadoras registradas en el sistema son datos deportivos bajo la responsabilidad del entrenador.</p>
        </Section>

        <Section title="3. Finalidad y base legal">
          <p>Tratamos tus datos con las siguientes finalidades:</p>
          <ul>
            <li><strong>Prestación del servicio</strong> (base: ejecución de contrato) — gestionar tu cuenta, almacenar y mostrarte las estadísticas de tu equipo.</li>
            <li><strong>Mejora del servicio</strong> (base: interés legítimo) — analizar el uso agregado de la aplicación para corregir errores y mejorar funcionalidades.</li>
            <li><strong>Cumplimiento legal</strong> (base: obligación legal) — conservar registros cuando la ley lo exija.</li>
          </ul>
        </Section>

        <Section title="4. Conservación de los datos">
          <p>Conservamos tus datos mientras tu cuenta esté activa. Si eliminas tu cuenta, procederemos a borrar tus datos en un plazo máximo de 30 días, salvo obligación legal de conservación.</p>
        </Section>

        <Section title="5. Destinatarios y transferencias">
          <p>Coachly utiliza los siguientes proveedores de servicios que pueden acceder a tus datos como encargados del tratamiento:</p>
          <ul>
            <li><strong>Supabase Inc.</strong> — almacenamiento de base de datos y autenticación (servidores en la UE).</li>
            <li><strong>Vercel Inc.</strong> — alojamiento de la aplicación web (servidores en la UE).</li>
          </ul>
          <p>No vendemos ni cedemos tus datos personales a terceros con fines comerciales.</p>
        </Section>

        <Section title="6. Tus derechos">
          <p>Tienes derecho a:</p>
          <ul>
            <li><strong>Acceso:</strong> saber qué datos tenemos sobre ti.</li>
            <li><strong>Rectificación:</strong> corregir datos inexactos.</li>
            <li><strong>Supresión:</strong> solicitar el borrado de tus datos («derecho al olvido»).</li>
            <li><strong>Portabilidad:</strong> recibir tus datos en un formato estructurado.</li>
            <li><strong>Oposición o limitación:</strong> oponerte a ciertos tratamientos.</li>
          </ul>
          <p>Para ejercer cualquiera de estos derechos, escríbenos a <strong>asiersoto1001@gmail.com</strong>. También puedes presentar una reclamación ante la Agencia Española de Protección de Datos (aepd.es).</p>
        </Section>

        <Section title="7. Cookies y almacenamiento local">
          <p>Coachly utiliza:</p>
          <ul>
            <li><strong>Cookies de sesión</strong> (necesarias) — para mantener tu sesión iniciada.</li>
            <li><strong>LocalStorage</strong> — para guardar preferencias locales como el tema visual o el estado de las secciones desplegables. Estos datos nunca se envían a nuestros servidores.</li>
          </ul>
          <p>No utilizamos cookies de publicidad ni de seguimiento de terceros.</p>
        </Section>

        <Section title="8. Seguridad">
          <p>Aplicamos medidas técnicas y organizativas adecuadas para proteger tus datos: comunicaciones cifradas (HTTPS), autenticación segura y acceso restringido a la base de datos mediante políticas de seguridad a nivel de fila (Row Level Security).</p>
        </Section>

        <Section title="9. Cambios en esta política">
          <p>Podemos actualizar esta política ocasionalmente. En caso de cambios significativos, te lo comunicaremos por correo electrónico o mediante un aviso visible en la aplicación.</p>
        </Section>

        <div style={{ marginTop: 48, padding: '20px 24px', borderRadius: 12, border: '1px solid #2e4538', backgroundColor: '#152019' }}>
          <p style={{ margin: 0, fontSize: 13, color: '#89968e' }}>
            ¿Preguntas sobre tu privacidad? Escríbenos a{' '}
            <a href="mailto:asiersoto1001@gmail.com" style={{ color: '#72e697' }}>asiersoto1001@gmail.com</a>
          </p>
        </div>
      </main>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#edf2ee', marginBottom: 12, fontFamily: 'Sora, sans-serif' }}>{title}</h2>
      <div style={{ fontSize: 14, lineHeight: 1.75, color: '#89968e' }}>
        {children}
      </div>
    </section>
  )
}

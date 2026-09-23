import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Términos de Uso',
  description: 'Condiciones de uso del servicio Coachly.',
}

export default function TerminosPage() {
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
          Términos de Uso
        </h1>
        <p style={{ fontSize: 13, color: '#637168', marginBottom: 48 }}>Última actualización: septiembre de 2026</p>

        <Section title="1. Objeto">
          <p>Coachly es una aplicación web para entrenadores de fútbol que permite gestionar plantillas, registrar estadísticas de partidos y consultar rankings y métricas de rendimiento del equipo. El uso de Coachly implica la aceptación plena de estos Términos de Uso.</p>
        </Section>

        <Section title="2. Registro y cuenta">
          <p>Para utilizar Coachly es necesario crear una cuenta. Te comprometes a:</p>
          <ul>
            <li>Proporcionar información veraz y mantenerla actualizada.</li>
            <li>Mantener la confidencialidad de tus credenciales de acceso.</li>
            <li>Notificarnos de inmediato cualquier uso no autorizado de tu cuenta.</li>
          </ul>
          <p>Cada cuenta es personal e intransferible. Está prohibido compartir credenciales entre usuarios distintos.</p>
        </Section>

        <Section title="3. Uso aceptable">
          <p>Al usar Coachly, te comprometes a no:</p>
          <ul>
            <li>Utilizar el servicio para fines ilegales o que violen derechos de terceros.</li>
            <li>Introducir datos de personas menores de edad sin el consentimiento de sus representantes legales.</li>
            <li>Intentar acceder a datos de otros entrenadores o manipular el sistema de seguridad.</li>
            <li>Realizar ingeniería inversa, copiar o redistribuir el software.</li>
            <li>Enviar contenido difamatorio, ofensivo o que infrinja derechos de propiedad intelectual.</li>
          </ul>
        </Section>

        <Section title="4. Datos de jugadoras">
          <p>Como usuario de Coachly, eres el responsable del tratamiento de los datos personales de las jugadoras que introduces en la plataforma. Coachly actúa como encargado del tratamiento en tu nombre. Te corresponde:</p>
          <ul>
            <li>Obtener las bases legales necesarias para registrar dichos datos.</li>
            <li>Informar a las jugadoras (o a sus representantes legales si son menores) sobre el uso de sus datos.</li>
          </ul>
        </Section>

        <Section title="5. Propiedad intelectual">
          <p>Todo el código, diseño, marcas y contenido de Coachly son propiedad de sus autores. Se te concede una licencia limitada, no exclusiva e intransferible para usar el servicio de acuerdo con estos términos. No adquieres ningún derecho de propiedad sobre la plataforma.</p>
          <p>Los datos que introduces (plantillas, resultados, estadísticas) son de tu propiedad. Coachly los aloja en tu nombre.</p>
        </Section>

        <Section title="6. Disponibilidad del servicio">
          <p>Coachly se ofrece «tal cual» y «según disponibilidad». Aunque hacemos todo lo posible por mantener el servicio operativo, no garantizamos disponibilidad ininterrumpida. Podemos modificar, suspender o interrumpir el servicio en cualquier momento, notificándolo con la mayor antelación posible.</p>
        </Section>

        <Section title="7. Limitación de responsabilidad">
          <p>En la medida en que lo permita la ley aplicable, Coachly no será responsable de daños indirectos, incidentales o consecuentes derivados del uso o imposibilidad de uso del servicio. Nuestra responsabilidad total no superará el importe pagado por el servicio en los últimos 12 meses (o cero si el servicio es gratuito).</p>
        </Section>

        <Section title="8. Modificaciones de los términos">
          <p>Podemos actualizar estos Términos de Uso. Los cambios se notificarán con al menos 15 días de antelación mediante correo electrónico o aviso en la aplicación. El uso continuado del servicio tras la notificación implica la aceptación de los nuevos términos.</p>
        </Section>

        <Section title="9. Cancelación de la cuenta">
          <p>Puedes cancelar tu cuenta en cualquier momento desde la sección de Perfil. Coachly puede suspender o cancelar cuentas que infrinjan estos términos, previo aviso salvo en casos graves.</p>
        </Section>

        <Section title="10. Ley aplicable y jurisdicción">
          <p>Estos términos se rigen por la legislación española. Para cualquier controversia, las partes se someten a los juzgados y tribunales del domicilio del usuario, salvo que la ley establezca otro fuero imperativo.</p>
        </Section>

        <div style={{ marginTop: 48, padding: '20px 24px', borderRadius: 12, border: '1px solid #2e4538', backgroundColor: '#152019' }}>
          <p style={{ margin: 0, fontSize: 13, color: '#89968e' }}>
            ¿Preguntas sobre los términos? Escríbenos a{' '}
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

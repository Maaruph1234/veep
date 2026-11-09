import { Header, Footer } from '@/components/Chrome'
export default function Privacy() {
  return (<div><Header /><main className="prose mx-auto max-w-2xl space-y-3 px-4 py-8 text-sm leading-6">
    <h1 className="text-xl font-semibold text-navy">Privacy notice</h1>
    <p>This notice explains how personal data is handled under the Nigeria Data Protection Act 2023. EDIT THIS TEXT with your lawyer before launch.</p>
    <p><b>Controller:</b> Directorate for Election Planning &amp; Monitoring (EPM), Kebbi State. <b>Contact:</b> [add email/phone of the data protection officer].</p>
    <p><b>What we collect:</b> name, LGA, ward, polling unit and code, gender, disability status, date of birth, only where the person has chosen to give it and agreed to its use.</p>
    <p><b>Purpose:</b> voter engagement and vote protection planning for the 2027 elections. We do not infer voting preferences or other sensitive details.</p>
    <p><b>Who sees it:</b> the sponsor who entered the record, and authorised EPM administrators. Access is logged.</p>
    <p><b>Your rights:</b> to see, correct or delete your record, or withdraw consent, by asking your sponsor or the contact above.</p>
    <p><b>Retention:</b> records are deleted within [set period] after the election period closes.</p>
  </main><Footer /></div>)
}

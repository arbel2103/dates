import { useState } from 'react'
import { Button, Card, Field, Input, PageHeader } from '../ui/Ui'
import { checkAccess } from '../../lib/github/client'
import { GIFT_BRANCH, getPat, getRepo, setPat, setRepo } from '../../lib/github/pat'
import { useSettings } from '../../store/useSettings'

type Check = { state: 'idle' } | { state: 'busy' } | { state: 'ok'; branch: string } | { state: 'bad'; message: string }

export default function SettingsPage() {
  const { partner, whatsapp, setPartner, setWhatsapp } = useSettings()
  const [token, setToken] = useState(getPat())
  const [repo, setRepoValue] = useState(getRepo())
  const [check, setCheck] = useState<Check>({ state: 'idle' })

  const save = async () => {
    setPat(token)
    setRepo(repo)
    setCheck({ state: 'busy' })
    try {
      setCheck({ state: 'ok', branch: await checkAccess() })
    } catch (err) {
      setCheck({ state: 'bad', message: err instanceof Error ? err.message : 'החיבור נכשל' })
    }
  }

  return (
    <div className="grid gap-5">
      <PageHeader title="הגדרות" />

      <Card className="grid gap-4">
        <Field label="בשביל מי" hint="ממלא את הטקסטים המוכנים">
          <Input value={partner} onChange={(e) => setPartner(e.target.value)} placeholder="השם שלה" />
        </Field>
        <Field label="מספר וואטסאפ" hint="למשל 972501234567 — משמש לכפתור השיתוף">
          <Input
            dir="ltr"
            inputMode="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
          />
        </Field>
      </Card>

      <Card className="grid gap-4">
        <div>
          <h2 className="font-semibold">העלאה של מתנות עם תמונות</h2>
          <p className="text-sm text-muted mt-1 leading-relaxed">
            מתנה בלי תמונות נכנסת כולה לתוך הקישור ולא צריכה כלום. ברגע שיש תמונות היא
            נהיית גדולה מדי, ולכן היא מוצפנת ומועלית לענף <code>{GIFT_BRANCH}</code> בריפו.
            המפתח נשאר בתוך הקישור עצמו — GitHub שומר בייטים שהוא לא יכול לקרוא.
          </p>
        </div>

        <Field label="ריפו">
          <Input dir="ltr" value={repo} onChange={(e) => setRepoValue(e.target.value)} />
        </Field>

        <Field
          label="טוקן GitHub"
          hint="Fine-grained token עם הרשאת Contents: read & write על הריפו הזה בלבד"
        >
          <Input
            dir="ltr"
            type="password"
            autoComplete="off"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="github_pat_…"
          />
        </Field>

        <Button onClick={save} disabled={check.state === 'busy'}>
          {check.state === 'busy' ? 'בודק…' : 'שמור ובדוק חיבור'}
        </Button>

        {check.state === 'ok' && (
          <p className="text-sm text-green-700">החיבור עובד. ענף ברירת המחדל: {check.branch}</p>
        )}
        {check.state === 'bad' && <p className="text-sm text-red-600">{check.message}</p>}

        <p className="text-xs text-muted">
          הטוקן נשמר רק בדפדפן הזה ולא נכנס לשום דבר שמתפרסם.
        </p>
      </Card>
    </div>
  )
}

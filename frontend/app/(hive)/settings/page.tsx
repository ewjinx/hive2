import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-heading mb-1">Settings</h1>
        <p className="text-muted-foreground text-sm">Configure your project preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-xl">Preferences</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground py-12 text-center">
          <div className="text-4xl mb-4">⚙️</div>
          <p className="font-semibold mb-1">Coming Soon</p>
          <p>Project-level preferences will appear here.</p>
        </CardContent>
      </Card>
    </div>
  )
}

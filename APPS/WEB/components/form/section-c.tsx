"use client"

function YesNoQuestion({ number, question, name, extra }: { number: string; question: string; name: string; extra?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-4">
      <div className="flex-1 text-sm">
        <span className="font-medium">{number}.</span> {question}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <label className="flex items-center gap-1 text-sm">
          <input type="radio" name={name} value="yes" className="accent-foreground" /> Yes
        </label>
        <label className="flex items-center gap-1 text-sm">
          <input type="radio" name={name} value="no" className="accent-foreground" /> No
        </label>
      </div>
      {extra}
    </div>
  )
}

export function SectionC() {
  return (
    <fieldset className="border border-foreground/30 p-4">
      <legend className="px-2 font-bold text-sm text-foreground">
        C. Tell us about your driving history
      </legend>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-4">
          <div className="flex-1 text-sm">
            <span className="font-medium">1.</span> Have you ever had a Driver License? If yes, write from what country, state, or jurisdiction?
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <label className="flex items-center gap-1 text-sm">
              <input type="radio" name="had_license" value="yes" className="accent-foreground" /> Yes
            </label>
            <label className="flex items-center gap-1 text-sm">
              <input type="radio" name="had_license" value="no" className="accent-foreground" /> No
            </label>
          </div>
        </div>
        <div className="ml-4">
          <input
            type="text"
            name="license_jurisdiction"
            placeholder="Country, state, or jurisdiction"
            className="w-full border-b border-foreground/30 bg-transparent py-1 text-sm outline-none focus:border-foreground"
          />
        </div>

        <YesNoQuestion
          number="2"
          question="Has your license ever been suspended or revoked?"
          name="license_suspended"
        />
        <YesNoQuestion
          number="3"
          question="Has your application for a Driver License been denied in another country or state?"
          name="license_denied"
        />

        <div className="mt-2 rounded border border-foreground/20 bg-muted/50 p-3">
          <p className="text-xs font-semibold uppercase text-foreground">
            IMPORTANT:
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Upon issuance of a driver license or identification card in the District of Columbia, any driver license or identification card previously issued by another state will be cancelled.
          </p>
        </div>
      </div>
    </fieldset>
  )
}

"use client"

export function SectionH() {
  return (
    <fieldset className="border border-foreground/30 p-4">
      <legend className="px-2 font-bold text-sm text-foreground">
        H. Applicant Certification
      </legend>
      <div className="flex flex-col gap-3">
        <p className="text-xs text-foreground leading-relaxed">
          I hereby certify, under penalty of perjury, that the information contained on this application is true and correct. If I am applying to register to vote, I swear or affirm that I meet each requirement listed in Section G. I understand that: a) any person using a fictitious name or address and/or knowingly making any false statement on this application is in violation of DC Law and subject to a fine of up to $1,000 and/or up to 180 days imprisonment (DC Official Code 22-2405), and; b) any person who registers to vote or attempts to register and makes any false representations as to their qualifications for registering is in violation of DC Law and subject to a fine of up to $10,000 and/or up to 5 years imprisonment (DC Official Code 1-1001.14(a)).
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mt-2">
          <div className="flex flex-col gap-0.5">
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              Applicant Signature
            </label>
            <div className="h-10 border-b border-foreground/30" />
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              Date
            </label>
            <input
              type="text"
              name="applicant_date"
              className="border-b border-foreground/30 bg-transparent py-1 text-sm outline-none focus:border-foreground"
            />
          </div>
        </div>
      </div>
    </fieldset>
  )
}

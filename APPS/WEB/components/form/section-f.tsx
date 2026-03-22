"use client"

export function SectionF() {
  return (
    <fieldset className="border border-foreground/30 p-4">
      <legend className="px-2 font-bold text-sm text-foreground">
        F. If you are 70+ years of age, your licensed medical practitioner MUST complete this section
      </legend>
      <div className="flex flex-col gap-3">
        {/* Practitioner info */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-0.5">
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              {"Practitioner's Name (print)"}
            </label>
            <input
              type="text"
              name="practitioner_name"
              className="border-b border-foreground/30 bg-transparent py-1 text-sm outline-none focus:border-foreground"
            />
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              {"Practitioner's Identification Number"}
            </label>
            <input
              type="text"
              name="practitioner_id"
              className="border-b border-foreground/30 bg-transparent py-1 text-sm outline-none focus:border-foreground"
            />
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              Phone Number
            </label>
            <input
              type="text"
              name="practitioner_phone"
              className="border-b border-foreground/30 bg-transparent py-1 text-sm outline-none focus:border-foreground"
            />
          </div>
        </div>

        {/* Ability to drive */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Does the applicant have the ability to safely drive a vehicle?</p>
          <div className="flex flex-col gap-1 ml-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="can_drive_70" value="yes" className="accent-foreground" />
              Yes, the applicant can safely drive a vehicle.
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="can_drive_70" value="no" className="accent-foreground" />
              No, the applicant cannot safely drive a vehicle.
            </label>
          </div>
        </div>

        {/* Practitioner signature */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mt-2 border-t border-foreground/20 pt-3">
          <div className="flex flex-col gap-0.5">
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              {"Practitioner's Signature"}
            </label>
            <div className="h-10 border-b border-foreground/30" />
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              Date
            </label>
            <input
              type="text"
              name="practitioner_date"
              className="border-b border-foreground/30 bg-transparent py-1 text-sm outline-none focus:border-foreground"
            />
          </div>
        </div>
      </div>
    </fieldset>
  )
}

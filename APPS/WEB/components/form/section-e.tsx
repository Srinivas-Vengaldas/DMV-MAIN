"use client"

export function SectionE() {
  return (
    <fieldset className="border border-foreground/30 p-4">
      <legend className="px-2 font-bold text-sm text-foreground">
        E. Tell us about your preferences
      </legend>
      <div className="flex flex-col gap-3">
        {/* 1. Selective Service */}
        <div className="text-sm">
          <span className="font-medium">1.</span> All males 18-26 years old will be registered with Selective Service. To opt out, complete the opt-out form.
        </div>

        {/* 2. Veteran */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex-1 text-sm">
            <span className="font-medium">2.</span> I would like to add a Veteran designation to my license/ID card.
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <label className="flex items-center gap-1 text-sm">
              <input type="checkbox" name="veteran" className="h-4 w-4 accent-foreground" /> Yes
            </label>
          </div>
        </div>
        <p className="text-xs text-muted-foreground ml-4">If yes, provide proof of your status.</p>

        {/* 3. Organ Donor */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex-1 text-sm">
            <span className="font-medium">3.</span> I would like to be an organ and tissue donor.
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <label className="flex items-center gap-1 text-sm">
              <input type="checkbox" name="organ_donor" className="h-4 w-4 accent-foreground" /> Yes
            </label>
          </div>
        </div>

        {/* 4. Language */}
        <div className="flex flex-col gap-1">
          <div className="text-sm">
            <span className="font-medium">4.</span> What language should we use to communicate with you?
          </div>
          <input
            type="text"
            name="preferred_language"
            className="ml-4 w-full max-w-sm border-b border-foreground/30 bg-transparent py-1 text-sm outline-none focus:border-foreground"
          />
        </div>

        {/* Special Designations */}
        <div className="mt-2 border-t border-foreground/20 pt-3">
          <p className="text-xs font-semibold text-foreground mb-2">
            Special Designations (Optional): Add to my Driver License or ID Card
          </p>
          <div className="flex flex-wrap gap-4 ml-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="designation_autism" className="h-4 w-4 accent-foreground" />
              Autism
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="designation_intellectual" className="h-4 w-4 accent-foreground" />
              Intellectual Disability
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="designation_visual" className="h-4 w-4 accent-foreground" />
              Visually Impaired
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="designation_hearing" className="h-4 w-4 accent-foreground" />
              Hearing Impaired
            </label>
          </div>
        </div>
      </div>
    </fieldset>
  )
}

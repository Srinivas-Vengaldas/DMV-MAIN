"use client"

function YesNoRow({ number, question, name }: { number: string; question: string; name: string }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
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
    </div>
  )
}

export function SectionD() {
  return (
    <fieldset className="border border-foreground/30 p-4">
      <legend className="px-2 font-bold text-sm text-foreground">
        D. Tell us about your medical history
      </legend>
      <p className="text-xs italic text-muted-foreground mb-3">
        Skip this section if you are only here for an ID card.
      </p>
      <div className="flex flex-col gap-3">
        <YesNoRow
          number="1"
          question="Do you require corrective lenses or glasses for the vision screening test?"
          name="corrective_lenses"
        />
        <YesNoRow
          number="2"
          question="Are you required to wear a hearing device while driving?"
          name="hearing_device"
        />

        <div className="mt-2 border-t border-foreground/20 pt-3">
          <p className="text-xs font-semibold text-foreground mb-2">
            In the past 5 years, have you had or been treated for any of the following? If yes, to an item, please complete the Medical/Eye form.
          </p>
          <div className="flex flex-col gap-2 ml-2">
            <YesNoRow number="1" question="Alzheimer's Disease" name="alzheimers" />
            <YesNoRow number="2" question="Insulin Dependent Diabetes" name="diabetes" />
            <YesNoRow number="3" question="Glaucoma, Cataracts, or Eye Diseases" name="eye_diseases" />
            <YesNoRow number="4" question="Seizure or Loss of Consciousness" name="seizure" />
            <YesNoRow
              number="5"
              question="Do you have other mental or physical conditions that would impair your ability to drive?"
              name="other_conditions"
            />
          </div>
        </div>
      </div>
    </fieldset>
  )
}

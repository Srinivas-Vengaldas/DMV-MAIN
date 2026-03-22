"use client"

export function SectionA() {
  return (
    <fieldset className="border border-foreground/30 p-4">
      <legend className="px-2 font-bold text-sm text-foreground">
        A. What do you need?
      </legend>
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="need_driver_license" className="h-4 w-4 accent-foreground" />
          Driver License
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="need_id_card" className="h-4 w-4 accent-foreground" />
          Identification Card
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="need_motorcycle" className="h-4 w-4 accent-foreground" />
          Motorcycle Endorsement
        </label>
      </div>
    </fieldset>
  )
}

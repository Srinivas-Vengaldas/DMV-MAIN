"use client";

export interface SectionBDefaults {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  zip?: string;
}

function FormField({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      <label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

function TextInput({
  name,
  defaultValue = "",
  className = "",
}: {
  name: string;
  defaultValue?: string;
  className?: string;
}) {
  return (
    <input
      type="text"
      name={name}
      defaultValue={defaultValue}
      className={`border-b border-foreground/30 bg-transparent py-1 text-sm outline-none focus:border-foreground ${className}`}
    />
  );
}

export function SectionB({ defaults }: { defaults?: SectionBDefaults }) {
  const d = defaults || {};

  return (
    <fieldset className="border border-foreground/30 p-4">
      <legend className="px-2 text-sm font-bold text-foreground">
        B. Tell us about yourself
      </legend>

      <div className="flex flex-col gap-3">
        {/* Row 1: Name */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <FormField label="Last Name" className="sm:col-span-2">
            <TextInput name="lastName" defaultValue={d.lastName} />
          </FormField>

          <FormField label="First Name">
            <TextInput name="firstName" defaultValue={d.firstName} />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Middle Name">
              <TextInput name="middleName" />
            </FormField>

            <FormField label="Jr./Sr./III, etc.">
              <TextInput name="suffix" />
            </FormField>
          </div>
        </div>

        {/* Row 2: Address */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
          <FormField
            label="Address where you live (a mailing only address cannot be used)"
            className="sm:col-span-8"
          >
            <TextInput name="address" defaultValue={d.address} />
          </FormField>

          <FormField label="Apt/Unit #" className="sm:col-span-2">
            <TextInput name="aptUnit" />
          </FormField>

          <FormField label="City & State" className="sm:col-span-2">
            <TextInput name="city" defaultValue={d.city || "Washington, DC"} />
          </FormField>
        </div>

        {/* Row 2b: ZIP */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
          <FormField label="ZIP Code" className="sm:col-span-2">
            <TextInput name="zip" defaultValue={d.zip} />
          </FormField>
          <div className="sm:col-span-10" />
        </div>

        {/* Row 3: DOB, SSN, Citizen, Gender */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-12">
          <FormField label="Date of Birth" className="sm:col-span-3">
            <div className="flex items-center gap-1">
              <input
                type="text"
                name="dobMonth"
                placeholder="MM"
                maxLength={2}
                className="w-8 border-b border-foreground/30 bg-transparent py-1 text-center text-sm outline-none focus:border-foreground"
              />
              <span className="text-muted-foreground">/</span>
              <input
                type="text"
                name="dobDay"
                placeholder="DD"
                maxLength={2}
                className="w-8 border-b border-foreground/30 bg-transparent py-1 text-center text-sm outline-none focus:border-foreground"
              />
              <span className="text-muted-foreground">/</span>
              <input
                type="text"
                name="dobYear"
                placeholder="YYYY"
                maxLength={4}
                className="w-12 border-b border-foreground/30 bg-transparent py-1 text-center text-sm outline-none focus:border-foreground"
              />
            </div>
          </FormField>

          <FormField label="Social Security #" className="sm:col-span-3">
            <TextInput name="ssn" />
          </FormField>

          <FormField label="US Citizen" className="sm:col-span-2">
            <div className="flex items-center gap-3 py-1">
              <label className="flex items-center gap-1 text-sm">
                <input type="radio" name="usCitizen" value="yes" className="accent-foreground" /> Yes
              </label>
              <label className="flex items-center gap-1 text-sm">
                <input type="radio" name="usCitizen" value="no" className="accent-foreground" /> No
              </label>
            </div>
          </FormField>

          <FormField label="Gender" className="sm:col-span-4">
            <div className="flex items-center gap-3 py-1">
              <label className="flex items-center gap-1 text-sm">
                <input type="radio" name="gender" value="male" className="accent-foreground" /> Male
              </label>
              <label className="flex items-center gap-1 text-sm">
                <input type="radio" name="gender" value="female" className="accent-foreground" /> Female
              </label>
              <label className="flex items-center gap-1 text-sm">
                <input type="radio" name="gender" value="unspecified" className="accent-foreground" /> Unspecified
              </label>
            </div>
          </FormField>
        </div>

        {/* Row 4: Weight, Height, Hair, Eye, Other names */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-12">
          <FormField label="Weight" className="sm:col-span-2">
            <div className="flex items-center gap-1">
              <TextInput name="weight" className="w-full" />
              <span className="whitespace-nowrap text-xs text-muted-foreground">LBS</span>
            </div>
          </FormField>

          <FormField label="Height" className="sm:col-span-2">
            <div className="flex items-center gap-1">
              <input
                type="text"
                name="heightFt"
                className="w-8 border-b border-foreground/30 bg-transparent py-1 text-center text-sm outline-none focus:border-foreground"
              />
              <span className="text-xs text-muted-foreground">FT</span>
              <input
                type="text"
                name="heightIn"
                className="w-8 border-b border-foreground/30 bg-transparent py-1 text-center text-sm outline-none focus:border-foreground"
              />
              <span className="text-xs text-muted-foreground">IN</span>
            </div>
          </FormField>

          <FormField label="Hair Color" className="sm:col-span-2">
            <TextInput name="hairColor" />
          </FormField>

          <FormField label="Eye Color" className="sm:col-span-2">
            <TextInput name="eyeColor" />
          </FormField>

          <FormField
            label="Other names you have used on a Driver License or ID Card"
            className="sm:col-span-4"
          >
            <TextInput name="otherNames" />
          </FormField>
        </div>

        {/* Row 5: Phone, Email */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
          <FormField label="Cell Phone" className="sm:col-span-3">
            <TextInput name="phone" defaultValue={d.phone} />
          </FormField>

          <FormField label="Alternate Phone" className="sm:col-span-3">
            <TextInput name="alternatePhone" />
          </FormField>

          <FormField label="Text Notification" className="sm:col-span-2">
            <div className="flex items-center gap-2 py-1">
              <label className="flex items-center gap-1 text-sm">
                <input type="checkbox" name="textNotification" className="h-4 w-4 accent-foreground" />
                Yes
              </label>
              <span className="text-[10px] text-muted-foreground">Standard rates apply</span>
            </div>
          </FormField>

          <FormField label="Email" className="sm:col-span-4">
            <TextInput name="email" defaultValue={d.email} />
          </FormField>
        </div>
      </div>
    </fieldset>
  );
}
import Image from "next/image"

export function Footer() {
  return (
    <footer id="contact" className="bg-accent text-accent-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <Image
              src="/images/dc-dmv-logo.png"
              alt="DC DMV - District of Columbia Department of Motor Vehicles"
              width={140}
              height={50}
              className="h-10 w-auto brightness-0 invert"
            />
            <p className="text-sm leading-relaxed opacity-70">
              Department of Motor Vehicles
              <br />
              District of Columbia
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-semibold uppercase tracking-wide opacity-80">Quick Links</h4>
            <nav className="flex flex-col gap-1.5">
              <a href="#" className="text-sm opacity-60 transition-opacity hover:opacity-100">Driver Licenses</a>
              <a href="#" className="text-sm opacity-60 transition-opacity hover:opacity-100">Vehicle Registration</a>
              <a href="#" className="text-sm opacity-60 transition-opacity hover:opacity-100">Pay Tickets</a>
              <a href="#" className="text-sm opacity-60 transition-opacity hover:opacity-100">Appointment Scheduling</a>
              <a href="#" className="text-sm opacity-60 transition-opacity hover:opacity-100">Forms</a>
            </nav>
          </div>

          {/* About */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-semibold uppercase tracking-wide opacity-80">About DMV</h4>
            <nav className="flex flex-col gap-1.5">
              <a href="#" className="text-sm opacity-60 transition-opacity hover:opacity-100">All DC DMV Locations</a>
              <a href="#" className="text-sm opacity-60 transition-opacity hover:opacity-100">Holiday Closing Schedule</a>
              <a href="#" className="text-sm opacity-60 transition-opacity hover:opacity-100">Career Opportunities</a>
              <a href="#" className="text-sm opacity-60 transition-opacity hover:opacity-100">Contact Us</a>
              <a href="#" className="text-sm opacity-60 transition-opacity hover:opacity-100">Privacy Policy</a>
            </nav>
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-semibold uppercase tracking-wide opacity-80">Contact</h4>
            <div className="flex flex-col gap-1.5 text-sm opacity-70">
              <p>Phone: (202) 737-4404</p>
              <p>TTY: 711</p>
              <p>311 (within DC)</p>
            </div>
            <div className="mt-2 flex gap-3">
              <a href="#" className="opacity-60 transition-opacity hover:opacity-100" aria-label="Facebook">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="#" className="opacity-60 transition-opacity hover:opacity-100" aria-label="Twitter">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="#" className="opacity-60 transition-opacity hover:opacity-100" aria-label="YouTube">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-accent-foreground/10 pt-6">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <p className="text-xs opacity-50">
              &copy; {new Date().getFullYear()} District of Columbia. All rights reserved.
            </p>
            <p className="text-xs opacity-50">
              An official website of the District of Columbia government - Mayor Muriel Bowser
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

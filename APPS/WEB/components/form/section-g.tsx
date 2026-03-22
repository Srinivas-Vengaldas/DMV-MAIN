"use client"

export function SectionG() {
  return (
    <fieldset className="border border-foreground/30 p-4">
      <legend className="px-2 font-bold text-sm text-foreground">
        G. Voter Registration
      </legend>
      <div className="flex flex-col gap-3">
        <p className="text-sm text-foreground">
          Unless you decline, the information you have provided on this application will be used to register you to vote. If you do not meet the voter registration requirements listed below, or if you do not want to register to vote, you MUST decline.
        </p>

        {/* Requirements */}
        <div className="rounded border border-foreground/20 bg-muted/50 p-3">
          <p className="text-xs font-semibold text-foreground mb-2">To register to vote through the DMV, you must:</p>
          <ul className="flex flex-col gap-1 text-xs text-muted-foreground list-disc ml-4">
            <li>Be a US Citizen</li>
            <li>Live in the District of Columbia. (You may not vote in an election in the District of Columbia unless you have lived in the District of Columbia for at least 30 days before the election in which you intend to vote.)</li>
            <li>Not claim voting residence or the right to vote in another state, territory, or country</li>
            <li>Be at least 16 years old. (You may pre-register at 16. You may vote in a primary election if you are at least 17 years old and you will be 18 years old by the next general election. You may vote in a general or special election if you are at least 18 years old.)</li>
            <li>Not have been found by a court to be legally incompetent to vote</li>
          </ul>
        </div>

        {/* Decline checkbox */}
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" name="decline_voter_registration" className="h-4 w-4 accent-foreground" />
          I decline. Do not register me to vote.
        </label>
        <p className="text-xs text-muted-foreground ml-6">
          {"If you decline, skip to Section H, Applicant Certification. Please note that if you decline but are eligible to register to vote, your information may be shared with the Board of Elections to update their records as provided in DC Official Code \u00A71-1001.07b(a)."}
        </p>

        {/* Party Registration */}
        <div className="mt-2 border-t border-foreground/20 pt-3">
          <p className="text-sm font-medium text-foreground mb-2">
            Party Registration. To vote in a primary election in the District of Columbia, you must be registered to vote in one of the following three (3) parties (Check ONE box below):
          </p>
          <div className="flex flex-col gap-2 ml-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="party" value="democratic" className="accent-foreground" />
              Democratic Party
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="party" value="dc_statehood_green" className="accent-foreground" />
              DC Statehood Green Party
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="party" value="republican" className="accent-foreground" />
              Republican Party
            </label>
          </div>

          <p className="text-xs text-muted-foreground mt-3 mb-2">
            {"If you register as \u201CNo Party (independent)\u201D or with another party not listed above, you may not vote in primary elections. If you do not choose a party, you will be registered as \u201CNo Party (independent).\u201D"}
          </p>

          <div className="flex flex-col gap-2 ml-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="party" value="no_party" className="accent-foreground" />
              No Party (independent)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="party" value="other" className="accent-foreground" />
              Other (write party name here):
              <input
                type="text"
                name="party_other"
                className="flex-1 border-b border-foreground/30 bg-transparent py-0.5 text-sm outline-none focus:border-foreground"
              />
            </label>
          </div>
        </div>

        {/* Voting help */}
        <div className="mt-2 border-t border-foreground/20 pt-3 flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-foreground">If you need help with voting, please tell us what type of help you need (optional):</label>
            <input
              type="text"
              name="voting_help"
              className="w-full border-b border-foreground/30 bg-transparent py-1 text-sm outline-none focus:border-foreground"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-foreground">Address where you get your mail (if different from above):</label>
            <input
              type="text"
              name="mailing_address"
              className="w-full border-b border-foreground/30 bg-transparent py-1 text-sm outline-none focus:border-foreground"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-foreground">Name and address on your last voter registration (include city and state if outside of DC):</label>
            <input
              type="text"
              name="last_voter_reg"
              className="w-full border-b border-foreground/30 bg-transparent py-1 text-sm outline-none focus:border-foreground"
            />
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
            <label className="text-sm text-foreground flex-1">Would you like information on serving as a poll worker in the next election?</label>
            <div className="flex items-center gap-3 shrink-0">
              <label className="flex items-center gap-1 text-sm">
                <input type="radio" name="poll_worker" value="yes" className="accent-foreground" /> Yes
              </label>
              <label className="flex items-center gap-1 text-sm">
                <input type="radio" name="poll_worker" value="no" className="accent-foreground" /> No
              </label>
            </div>
          </div>
        </div>

        {/* Important Notices */}
        <div className="mt-2 border-t border-foreground/20 pt-3">
          <p className="text-xs font-semibold text-foreground mb-1">Important Notices.</p>
          <div className="text-xs text-muted-foreground flex flex-col gap-2">
            <p>
              Voter registration information is public, with the exception of full/partial social security numbers, dates of birth, email addresses, and phone numbers. If you decline to register to vote, your decision will be confidential. If you choose to register to vote, the agency at which your voter registration application is submitted will remain confidential and will be used only for your voter registration purposes.
            </p>
            <p>
              {"If you would like to make your residence and/or mailing address confidential, please contact the Board of Elections' Voter Services Division at 202-727-2525 or at voterservices@dcboe.org for more information."}
            </p>
            <p>
              {"If you believe that someone has interfered with your right: a) to register to vote; b) to decline to register to vote; c) to privacy in deciding whether to register or in applying to register to vote; or d) to choose your own political party or other political preference, you may file a complaint with the Executive Director of the Board of Elections, 1015 Half Street, SE, Suite 750, Washington, DC 20003."}
            </p>
            <p>
              {"If you do not receive a voter registration card within three weeks of completing this application, call the Board of Elections at 202-727-2525. You may also visit the Board of Elections' website at www.dcboe.org. For TTY assistance, call 711. Si necesita esta informaci\u00F3n en espa\u00F1ol, llame al 202-727-2525."}
            </p>
          </div>
        </div>
      </div>
    </fieldset>
  )
}

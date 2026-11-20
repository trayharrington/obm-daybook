export type Contact = {
  name: string;
  email: string;
};

export type Account = {
  id: string;
  accountName: string;
  owner: Contact;
  planSize: string;
  customerType: "new_business" | "existing_customer";
  authorizedContacts: Contact[];
  startDate: string;
  welcomeSentOn: string | null;
  kickoffBookedOn: string | null;
  kickoffCallOn: string | null;
  planSharedOn: string | null;
  toolsSharedOn: string | null;
  handoffSentOn: string | null;
  remindersSentOn: string[];
  kickoffOutcome: "held" | "no_show" | "waived" | null;
  kickoffWaivedOn: string | null;
  rescheduleOutreachSentOn: string | null;
  checkInsSentOn: string[];
};

export const accounts: Account[] = [
  {
    id: "a1b2c3",
    accountName: "Prairie Oak Bakery",
    owner: {name: "Dana Whitfield", email: "dana@prairieoak.example.com"},
    planSize: "Small",
    customerType: "new_business",
    authorizedContacts: [{name: "Sam Ortiz", email: "sam@prairieoak.example.com"}],
    startDate: "2026-11-02",
    welcomeSentOn: "2026-11-02",
    remindersSentOn: [],
    kickoffBookedOn: "2026-11-04",
    kickoffCallOn: "2026-11-10",
    kickoffOutcome: "held",
    kickoffWaivedOn: null,
    rescheduleOutreachSentOn: null,
    checkInsSentOn: [],
    planSharedOn: null,
    toolsSharedOn: null,
    handoffSentOn: null
  },
  {
    id: "a2b3c4",
    accountName: "Green Family Farms",
    owner: {name: "Billiam Green", email: "bill@greenfamily.example.com"},
    planSize: "Medium",
    customerType: "new_business",
    authorizedContacts:
      [
        {name: "Cricket Green", email: "cricket@greenfamily.example.com"},
        {name: "Tilly Green", email: "till@greenfamily.example.com"}
      ],
    startDate: "2026-11-15",
    welcomeSentOn: "2026-11-15",
    remindersSentOn: [],
    kickoffBookedOn: null,
    kickoffCallOn: null,
    kickoffOutcome: null,
    kickoffWaivedOn: null,
    rescheduleOutreachSentOn: null,
    checkInsSentOn: [],
    planSharedOn: null,
    toolsSharedOn: null,
    handoffSentOn: null
  }
]
export function getAccounts(): Account[] {
  return accounts;
}

export function addAccount(account: Account): void {
  accounts.push(account);
}
export function getAccountById(id: string): Account | undefined {
  return accounts.find(account => account.id === id);
}


// Mock data for offline testing
export const MOCK_RESPONSE = {
  title: "Brave Browser Terms of Use Agreement",
  plain_language_version: "This is your contract with Brave. If part of it doesn't work legally, they'll fix just that part. You can't transfer this agreement to someone else without permission, but Brave can. You're not employees or partners with Brave - just users of their service.",
  key_points: [
    {
      heading: "Complete Agreement",
      explanation: "This document represents the entire agreement between you and Brave, replacing any previous communications or proposals about the service."
    },
    {
      heading: "Severability Clause",
      explanation: "If any provision is found unenforceable, it will be modified minimally to make it work, while the rest of the agreement stays intact."
    },
    {
      heading: "Non-Assignment",
      explanation: "You cannot transfer your rights under this agreement to anyone else without Brave's written permission, but Brave can freely assign their rights and obligations."
    },
  ],
  concerns: [
    "Brave can transfer their obligations to another company without your consent",
    "The agreement heavily favors Brave with one-sided assignment rights",
    "No explicit dispute resolution or arbitration clause mentioned",
    "Limited liability protections for Brave in case of service failures"
  ]
};

export function testMockRender(renderCompleteTest) {
  const empty = document.querySelector("#empty-state");
  empty.style.display = 'none';
  const results = document.querySelector("#results");
  renderCompleteTest(MOCK_RESPONSE, results);
  
  window.scrollTo({
    top: document.body.scrollHeight,
    behavior: 'smooth'
  });
}

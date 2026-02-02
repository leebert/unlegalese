// Mock data for offline testing
export const MOCK_RESPONSE = {
  title: "Brave Browser Terms of Use Agreement",
  summary: "This agreement establishes the complete legal relationship between you and Brave regarding your use of their service. The terms are binding and supersede any previous agreements. If any part is found invalid, only that specific part is removed while the rest remains in effect. Both parties retain all rights unless explicitly waived in writing, and neither party can be held liable for circumstances beyond their reasonable control.",
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
    {
      heading: "No Partnership Created",
      explanation: "Using Brave's service doesn't create any employment, partnership, or joint venture relationship - you're simply a user of their service."
    },
    {
      heading: "Notice Requirements",
      explanation: "All official notices must be in writing and are considered delivered when received in person, confirmed electronically, or after a specified delivery period."
    }
  ],
  concerns: [
    "Brave can transfer their obligations to another company without your consent",
    "The agreement heavily favors Brave with one-sided assignment rights",
    "No explicit dispute resolution or arbitration clause mentioned",
    "Limited liability protections for Brave in case of service failures"
  ]
};

export function testMockRender(renderCompleteFinal) {
  const thinking = document.querySelector("#thinking");
  const results = document.querySelector("#results");
  
  thinking.style.display = "block";
  
  thinking.style.display = "none";
  renderCompleteFinal(MOCK_RESPONSE, results);
  
//   window.scrollTo({
//     top: document.body.scrollHeight,
//     behavior: 'smooth'
//   });
}

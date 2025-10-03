// Listen for extension icon clicks
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.url.startsWith("http")) {
    return;
  }

  // Get current scheme
  const result = await chrome.storage.local.get(["colorScheme"]);
  const currentScheme = result.colorScheme || "light";
  const newScheme = currentScheme === "light" ? "dark" : "light";

  // Save new scheme
  await chrome.storage.local.set({ colorScheme: newScheme });

  // Update icon based on scheme
  const iconPath = newScheme === "dark" ? "dark" : "light";
  await chrome.action.setIcon({
    path: {
      16: `${iconPath}16.png`,
      32: `${iconPath}32.png`,
    },
  });

  // Use debugger API to emulate color scheme
  try {
    // Try to attach (will fail if already attached, which is fine)
    try {
      await chrome.debugger.attach({ tabId: tab.id }, "1.3");
    } catch (attachError) {
      // Already attached, that's okay
      console.log("Debugger already attached");
    }

    await chrome.debugger.sendCommand(
      { tabId: tab.id },
      "Emulation.setEmulatedMedia",
      {
        features: [
          {
            name: "prefers-color-scheme",
            value: newScheme,
          },
        ],
      }
    );
    console.log(`Color scheme changed to ${newScheme}`);
  } catch (error) {
    console.error("Error toggling color scheme:", error);
  }
});

// Listen for debugger detach events
chrome.debugger.onDetach.addListener((source, reason) => {
  console.log(`Debugger detached from tab ${source.tabId}. Reason: ${reason}`);
  if (reason === "target_closed") {
    console.log("Tab was closed");
  } else if (reason === "canceled_by_user") {
    console.log(
      "⚠️ Warning: Color scheme emulation stopped because DevTools was opened. Close DevTools and toggle again to re-enable."
    );
  }
});

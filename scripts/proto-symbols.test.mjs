import { test } from "node:test";
import assert from "node:assert/strict";
import { protoSymbols } from "./proto-symbols.mjs";

const HEALTH = `
syntax = "proto3";
package anolis.deviceprovider.v1;

// A comment that mentions message Fake { and enum Fake {
message ProviderHealth {
  enum State {
    STATE_UNSPECIFIED = 0;
  }
  State state = 1;
  map<string, string> metrics = 2;
}

message DeviceHealth {
  enum State { STATE_UNSPECIFIED = 0; }
  message Detail {
    string text = 1;
  }
}

service DeviceProvider {
  rpc Call(Request) returns (Response);
}
`;

test("nested enums with the same name are kept apart", () => {
  const s = protoSymbols(HEALTH);
  assert.deepEqual(s.enums, ["ProviderHealth.State", "DeviceHealth.State"]);
});

test("nested messages are named by their parent", () => {
  const s = protoSymbols(HEALTH);
  assert.deepEqual(s.messages, ["ProviderHealth", "DeviceHealth", "DeviceHealth.Detail"]);
});

test("comments are not read as declarations", () => {
  const s = protoSymbols(HEALTH);
  assert.equal(s.messages.includes("Fake"), false);
  assert.equal(s.enums.includes("Fake"), false);
});

test("package, services and rpcs are read", () => {
  const s = protoSymbols(HEALTH);
  assert.equal(s.packageName, "anolis.deviceprovider.v1");
  assert.deepEqual(s.services, ["DeviceProvider"]);
  assert.deepEqual(s.rpcs, ["Call"]);
});

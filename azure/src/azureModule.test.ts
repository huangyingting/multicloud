import { AzureModule, AzureContext, AzureRequest, AzureResponse, AzureBlobStorage } from ".";
import {
  ComponentType,
  CloudContext,
  CloudRequest,
  CloudResponse,
  CloudContainer,
  CloudService,
  CloudStorage,
  ProviderType,
  App } from "@multicloud/sls-core";
import { AzureFunctionCloudService } from "./services";
import { StorageURL, SharedKeyCredential } from "@azure/storage-blob";

jest.mock("@azure/storage-blob");

describe("Azure Cloud Module", () => {
  const params: any[] = [
    {
      invocationId: expect.any(String),
      req: {},
      res: {},
      log: {},
      bindingDefinitions: [],
    }];
  const azureModule = new AzureModule();
  let container = new CloudContainer();

  describe("when azure request", () => {
    beforeAll(() => {
      process.env.NODE_ENV = "test-azure";
      container = new CloudContainer();
      container.registerModule(azureModule);
      container.bind(ComponentType.RuntimeArgs).toConstantValue(params);
    });

    it("resolves context as singleton", () => {
      const context1 = container.resolve<CloudContext>(ComponentType.CloudContext);
      const context2 = container.resolve<CloudContext>(ComponentType.CloudContext);

      expect(context1).toBeInstanceOf(AzureContext);
      expect(context1.providerType).toBe(ProviderType.Azure);
      expect(context1).toBe(context2);
    });

    it("Resolves new context per request", async () => {
      const requestCount = 2;
      const contextInstances: AzureContext[] = [];
      const app = new App(new AzureModule());

      const handler = (context: AzureContext) => {
        contextInstances.push(context);
        context.done();
      };

      for (var i = 0; i < 2; i++) {
        await app.use([], handler)(...params);
      }

      expect(contextInstances).toHaveLength(requestCount);
      expect(contextInstances[0]).not.toBe(contextInstances[1]);
    });

    it("resolves request", () => {
      const request = container.resolve<CloudRequest>(ComponentType.CloudRequest);
      expect(request).toBeInstanceOf(AzureRequest);
    });

    it("resolves response", () => {
      const response = container.resolve<CloudResponse>(ComponentType.CloudResponse);
      expect(response).toBeInstanceOf(AzureResponse);
    });

    it("resolves service", () => {
      const service = container.resolve<CloudService>(ComponentType.CloudService);
      expect(service).toBeInstanceOf(AzureFunctionCloudService);
    });

    it("resolves storage", () => {
      SharedKeyCredential.prototype.create = jest.fn().mockReturnValue({});
      StorageURL.newPipeline = jest.fn();

      const storage = container.resolve<CloudStorage>(ComponentType.CloudStorage);
      expect(storage).toBeInstanceOf(AzureBlobStorage);
    });
  });

  describe("when non-azure request", () => {
    beforeAll(() => {
      container = new CloudContainer();
      container.registerModule(azureModule);
      container.bind(ComponentType.RuntimeArgs).toConstantValue([{}]);
    });

    it("does not resolve context", () => {
      expect(container.resolve<CloudContext>(ComponentType.CloudContext)).toBeNull();
    });

    it("does not resolve request", () => {
      expect(container.resolve<CloudContext>(ComponentType.CloudRequest)).toBeNull();
    });

    it("does not resolve response", () => {
      expect(container.resolve<CloudContext>(ComponentType.CloudResponse)).toBeNull();
    });

    it("does not resolve service", () => {
      expect(container.resolve<CloudService>(ComponentType.CloudService)).toBeNull();
    });

    it("does not resolve storage", () => {
      expect(container.resolve<CloudStorage>(ComponentType.CloudStorage)).toBeNull();
    });
  })
});

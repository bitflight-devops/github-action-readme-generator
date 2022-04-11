describe('test required environment variables', () => {
  beforeAll(() => {
    // GitHub workspace
    // GitHub workspace
    process.env['GHADOCS_OWNER'] = 'bitflight-devops';
    process.env['GHADOCS_REPOSITORY'] = 'github-action-readme-generator';
  });
  beforeEach(() => {
    // Reset inputs
  });
  afterAll(() => {
    // Restore GitHub workspace
    delete process.env['GHADOCS_REPOSITORY'];
    delete process.env['GHADOCS_OWNER'];
    // Restore
    jest.restoreAllMocks();
  });

  it('Check Env Vars', () => {
    expect(process.env['GHADOCS_OWNER']).toEqual('bitflight-devops');
    expect(process.env['GHADOCS_REPOSITORY']).toEqual('github-action-readme-generator');
  });
});

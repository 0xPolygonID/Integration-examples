import { W3CCredential } from '../../verifiable';
import { StandardJSONCredentialsQueryFilter } from '../filters';
/**
 * Implementation of ICredentialStorage with KV Data source
 *
 * @public
 * @class CredentialStorage
 * @implements {ICredentialStorage}
 */
export class CredentialStorage {
    /**
     * Creates an instance of CredentialStorage.
     * @param {IDataSource<W3CCredential>} _dataSource - W3CCredential credential KV data source
     */
    constructor(_dataSource) {
        this._dataSource = _dataSource;
    }
    /** {@inheritdoc ICredentialStorage.listCredentials } */
    async listCredentials() {
        const creds = await this._dataSource.load();
        return creds.filter((i) => i !== undefined).map((cred) => cred && W3CCredential.fromJSON(cred));
    }
    /** @inheritdoc */
    async saveCredential(credential) {
        return this._dataSource.save(credential.id, credential.toJSON());
    }
    /** {@inheritdoc ICredentialStorage.listCredentials } */
    async saveAllCredentials(credentials) {
        for (const credential of credentials) {
            await this.saveCredential(credential);
        }
    }
    /** {@inheritdoc ICredentialStorage.listCredentials } */
    async removeCredential(id) {
        return this._dataSource.delete(id);
    }
    /** {@inheritdoc ICredentialStorage.listCredentials } */
    async findCredentialById(id) {
        const cred = await this._dataSource.get(id);
        return cred && W3CCredential.fromJSON(cred);
    }
    /** {@inheritdoc ICredentialStorage.listCredentials }
     * uses JSON query
     */
    async findCredentialsByQuery(query) {
        const filters = StandardJSONCredentialsQueryFilter(query);
        const creds = (await this._dataSource.load()).filter((credential) => filters.every((filter) => filter.execute(credential)));
        const mappedCreds = creds
            .filter((i) => i !== undefined)
            .map((cred) => W3CCredential.fromJSON(cred));
        return mappedCreds;
    }
}
/**
 * key for storage
 *
 * @static
 */
CredentialStorage.storageKey = 'credentials';

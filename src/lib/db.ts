import { config, ConnectionPool } from 'mssql';

function createDbConfig(): config {
  const authType = process.env.DB_AUTH_TYPE || 'sql';
  const base = {
    server: process.env.DB_SERVER || '127.0.0.1',
    database: process.env.DB_DATABASE || 'Teknik_TVRI',
    options: {
      encrypt: process.env.DB_ENCRYPT === 'true',
      trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
    connectionTimeout: 60000,
    requestTimeout: 60000,
  };

  if (authType === 'windows') {
    let userName = process.env.DB_USER || '';
    let domain = process.env.DB_DOMAIN || process.env.USERDOMAIN || '';
    const password = process.env.DB_PASSWORD || '';

    // Support DOMAIN\user format in DB_USER
    const backslashIdx = userName.indexOf('\\');
    if (backslashIdx !== -1) {
      domain = userName.slice(0, backslashIdx);
      userName = userName.slice(backslashIdx + 1);
    }

    if (userName && password) {
      return {
        ...base,
        authentication: {
          type: 'ntlm',
          options: {
            userName,
            password,
            domain: domain,
          },
        },
      };
    }

    return {
      ...base,
      options: {
        ...base.options,
        trustedConnection: true,
      },
    };
  }

  return {
    ...base,
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'Passw0rd',
  };
}

const dbConfig: config = createDbConfig();

// Create connection pool
let pool: ConnectionPool | null = null;

/**
 * Get database connection pool
 * Creates pool if it doesn't exist, returns existing pool otherwise
 * Validates connection and recreates if needed
 */
export async function getDbPool(): Promise<ConnectionPool> {
  if (!pool) {
    try {
      pool = new ConnectionPool(dbConfig);
      await pool.connect();
    } catch (error) {
      console.error('Error creating database connection pool:', error);
      throw error;
    }
  } else if (pool.connected === false) {
    // Pool exists but connection is closed, reconnect
    try {
      await pool.connect();
    } catch (error) {
      console.error('Error reconnecting database:', error);
      // Try to create new pool
      try {
        pool = new ConnectionPool(dbConfig);
        await pool.connect();
      } catch (reconnectError) {
        console.error('Error creating new database connection pool:', reconnectError);
        throw reconnectError;
      }
    }
  }
  return pool;
}

/**
 * Execute SQL query with parameters
 * @param query - SQL query string
 * @param params - Query parameters object
 * @returns Query result
 */
export async function executeQuery<T = any>(
  query: string,
  params: Record<string, any> = {}
): Promise<T[]> {
  const maxRetries = 2;
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const pool = await getDbPool();
      const request = pool.request();
      
      // Add parameters to request
      Object.entries(params).forEach(([key, value]) => {
        request.input(key, value);
      });
      
      const result = await request.query(query);
      return result.recordset as T[];
    } catch (error: any) {
      lastError = error;
      
      // If it's a connection error and we have retries left, try again
      if (attempt < maxRetries && (error.code === 'ECONNCLOSED' || error.code === 'EREQUEST')) {
        // Reset pool to force reconnection
        if (pool && pool.connected === false) {
          pool = null;
        }
        continue;
      }
      break;
    }
  }
  
  if (lastError) {
    throw lastError;
  }
  
  return [];
}

/**
 * Execute SQL query that returns single record
 * @param query - SQL query string
 * @param params - Query parameters object
 * @returns Single record or null
 */
export async function executeQuerySingle<T>(query: string, params: Record<string, any> = {}): Promise<T | null> {
  let attempt = 1;
  const maxRetries = 2;
  let lastError: any = null;

  while (attempt <= maxRetries) {
    try {
      const pool = await getDbPool();
      const request = pool.request();
      
      // Add parameters to request
      Object.entries(params).forEach(([key, value]) => {
        request.input(key, value);
      });

      const result = await request.query(query);
      
      // Check if recordset exists and has at least one row
      if (result && result.recordset && result.recordset.length > 0) {
        return result.recordset[0] as T;
      }
      
      return null;
    } catch (error: any) {
      lastError = error;
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        attempt++;
      }
      break;
    }
  }
  
  throw lastError;
}

/**
 * Close database connection pool
 * Call this when application is shutting down
 */
export async function closeDbPool(): Promise<void> {
  if (pool) {
    try {
      await pool.close();
      pool = null;
    } catch (error) {
      console.error('Error closing database connection pool:', error);
      throw error;
    }
  }
}

/**
 * Test database connection
 * @returns true if connection is successful, false otherwise
 */
export async function testConnection(): Promise<boolean> {
  try {
    const pool = await getDbPool();
    await pool.request().query('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

export default {
  getDbPool,
  executeQuery,
  executeQuerySingle,
  closeDbPool,
  testConnection,
};

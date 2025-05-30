const { Model } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

/**
 * Base model class that all models will extend
 * Provides common functionality and default configurations
 */
class BaseModel extends Model {
  /**
   * Initialize the model with common options
   * @param {Object} attributes - Model attributes
   * @param {Object} options - Model options
   * @returns {Model} The initialized model
   */
  static init(attributes, options = {}) {
    const defaultOptions = {
      timestamps: true,
      paranoid: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
      hooks: {
        beforeCreate: (instance) => {
          // Generate UUID for primary key if not provided
          if (!instance.id && instance.constructor.primaryKeyAttributes.includes('id')) {
            instance.id = uuidv4();
          }
        },
        afterCreate: (instance) => {
          logger.debug(`Created new ${instance.constructor.name} with ID: ${instance.id}`);
        },
        afterUpdate: (instance) => {
          logger.debug(`Updated ${instance.constructor.name} with ID: ${instance.id}`);
        },
        afterDestroy: (instance) => {
          logger.debug(`Soft-deleted ${instance.constructor.name} with ID: ${instance.id}`);
        },
        ...(options.hooks || {})
      },
      defaultScope: {
        attributes: {
          exclude: ['deleted_at', 'password', 'reset_password_token', 'reset_password_expires']
        },
        ...(options.defaultScope || {})
      },
      scopes: {
        withPassword: {
          attributes: {}
        },
        withTimestamps: {
          attributes: {
            include: ['created_at', 'updated_at']
          }
        },
        withAll: {
          paranoid: false,
          attributes: {}
        },
        ...(options.scopes || {})
      },
      ...options
    };

    return super.init(attributes, defaultOptions);
  }

  /**
   * Get the table name for the model
   * @returns {string} The table name
   */
  static get tableName() {
    return this.tableName || this.name.toLowerCase() + 's';
  }

  /**
   * Find a record by ID or throw an error if not found
   * @param {string|number} id - The ID of the record to find
   * @param {Object} options - Query options
   * @returns {Promise<Model>} The found record
   * @throws {Error} If record not found
   */
  static async findByIdOrFail(id, options = {}) {
    const record = await this.findByPk(id, options);
    if (!record) {
      const error = new Error(`${this.name} not found`);
      error.status = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }
    return record;
  }

  /**
   * Find or create a record with the given where clause
   * @param {Object} where - The where clause
   * @param {Object} defaults - Default values if creating
   * @param {Object} options - Query options
   * @returns {Promise<[Model, boolean]>} The found or created record and a boolean indicating if it was created
   */
  static async findOrCreate(where, defaults = {}, options = {}) {
    return this.findOrCreate({
      where,
      defaults,
      ...options
    });
  }

  /**
   * Update a record by ID
   * @param {string|number} id - The ID of the record to update
   * @param {Object} data - The data to update
   * @param {Object} options - Query options
   * @returns {Promise<[number, Model[]]>} The number of affected rows and the updated records
   */
  static async updateById(id, data, options = {}) {
    const [affectedCount, affectedRows] = await this.update(data, {
      where: { id },
      returning: true,
      individualHooks: true,
      ...options
    });

    if (affectedCount === 0) {
      const error = new Error(`${this.name} not found`);
      error.status = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    return [affectedCount, affectedRows];
  }

  /**
   * Delete a record by ID
   * @param {string|number} id - The ID of the record to delete
   * @param {boolean} force - Whether to force delete (bypass soft delete)
   * @param {Object} options - Query options
   * @returns {Promise<number>} The number of deleted rows
   */
  static async deleteById(id, force = false, options = {}) {
    const result = await this.destroy({
      where: { id },
      force,
      ...options
    });

    if (result === 0) {
      const error = new Error(`${this.name} not found`);
      error.status = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    return result;
  }

  /**
   * Restore a soft-deleted record by ID
   * @param {string|number} id - The ID of the record to restore
   * @param {Object} options - Query options
   * @returns {Promise<Model>} The restored record
   */
  static async restoreById(id, options = {}) {
    const record = await this.findByPk(id, {
      ...options,
      paranoid: false
    });

    if (!record) {
      const error = new Error(`${this.name} not found`);
      error.status = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    if (!record.deleted_at) {
      const error = new Error(`${this.name} is not deleted`);
      error.status = 400;
      error.code = 'NOT_DELETED';
      throw error;
    }

    await record.restore();
    return record.reload();
  }

  /**
   * Paginate query results
   * @param {Object} options - Query options
   * @param {number} options.page - Page number (1-based)
   * @param {number} options.limit - Number of records per page
   * @returns {Promise<Object>} Paginated results with metadata
   */
  static async paginate(options = {}) {
    const page = Math.max(1, parseInt(options.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(options.limit, 10) || 10));
    const offset = (page - 1) * limit;

    // Remove pagination options from query
    const { page: _, limit: __, ...queryOptions } = options;

    const { count, rows } = await this.findAndCountAll({
      ...queryOptions,
      offset,
      limit,
      distinct: true
    });

    const totalPages = Math.ceil(count / limit);

    return {
      data: rows,
      meta: {
        total: count,
        per_page: limit,
        current_page: page,
        total_pages: totalPages,
        has_next_page: page < totalPages,
        has_previous_page: page > 1
      }
    };
  }

  /**
   * Convert model instance to JSON
   * @param {Object} options - Options for toJSON
   * @returns {Object} The JSON representation of the model
   */
  toJSON(options = {}) {
    // Get the plain object representation
    const json = super.toJSON();
    
    // Convert Sequelize special fields to camelCase
    const formatted = {};
    
    Object.keys(json).forEach(key => {
      // Convert snake_case to camelCase
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      
      // Handle dates
      if (json[key] instanceof Date) {
        formatted[camelKey] = json[key].toISOString();
      } else {
        formatted[camelKey] = json[key];
      }
    });
    
    return formatted;
  }
}

module.exports = BaseModel;

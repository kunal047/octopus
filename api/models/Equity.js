



module.exports = {
  tableName: "equity",
  attributes: {
    id: {
      type: "number",
      columnName: "security_code",
      required: true
    },
    security_id: {
      type: "string",
      required: true
    },
    security_name: {
      type: "string",
      required: true
    },
    status: {
      type: "string",
      required: true
    },
    security_group: {
      type: "string",
      required: true
    },
    face_value: {
      type: "string",
      required: true
    },
    isin_no: {
      type: "string",
      required: true
    },
    industry: {
      type: "string",
      required: true
    }
  }
};
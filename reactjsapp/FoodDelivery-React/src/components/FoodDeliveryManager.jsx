import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import './style.css';

const emptyFood = {
  orderCode: '',
  restaurantName: '',
  deliveryFee: '',
  delivered: ''
};

const FoodDeliveryManager = () => {
  const [foods, setFoods] = useState([]);
  const [food, setFood] = useState(emptyFood);
  const [idToFetch, setIdToFetch] = useState('');
  const [fetchedFood, setFetchedFood] = useState(null);
  const [message, setMessage] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  const configuredApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081';
  const apiRoot = configuredApiUrl.replace(/\/+$/, '');
  const baseUrl = apiRoot.endsWith('/food') ? apiRoot : `${apiRoot}/food`;

  const requestAllFoods = useCallback(
    async () => {
      const res = await axios.get(`${baseUrl}/displayall`);
      if (!Array.isArray(res.data)) {
        throw new Error('The food API returned an invalid order list.');
      }
      return res.data;
    },
    [baseUrl]
  );

  const fetchAllFoods = useCallback(async () => {
    try {
      setFoods(await requestAllFoods());
    } catch {
      setMessage(`Failed to fetch food orders. Check that the API is running at ${baseUrl}.`);
    }
  }, [baseUrl, requestAllFoods]);

  useEffect(() => {
    let isActive = true;

    requestAllFoods()
      .then((orders) => {
        if (isActive) setFoods(orders);
      })
      .catch(() => {
        if (isActive) {
          setMessage(`Failed to fetch food orders. Check that the API is running at ${baseUrl}.`);
        }
      });

    return () => {
      isActive = false;
    };
  }, [baseUrl, requestAllFoods]);

  const handleChange = (e) => {
    setFood({
      ...food,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (!food.orderCode.trim()) {
      setMessage('Please enter the order code.');
      return false;
    }

    if (!food.restaurantName.trim()) {
      setMessage('Please enter the restaurant name.');
      return false;
    }

    if (
      food.deliveryFee === '' ||
      !Number.isFinite(Number(food.deliveryFee)) ||
      Number(food.deliveryFee) < 0
    ) {
      setMessage('Please enter a valid delivery fee.');
      return false;
    }

    if (food.delivered !== 'true' && food.delivered !== 'false') {
      setMessage('Please select the delivery status.');
      return false;
    }

    return true;
  };

  const resetForm = () => {
    setFood({ ...emptyFood });
    setEditMode(false);
    setEditId(null);
  };

  const addFood = async () => {
    if (!validateForm()) return;

    try {
      const payload = {
        orderCode: food.orderCode.trim(),
        restaurantName: food.restaurantName.trim(),
        deliveryFee: Number(food.deliveryFee),
        delivered: food.delivered === 'true'
      };

      await axios.post(`${baseUrl}/add`, payload);

      setMessage('Food order added successfully.');
      resetForm();
      await fetchAllFoods();
    } catch (error) {
      setMessage(
        error.response?.data || 'Error adding food order.'
      );
    }
  };

  const updateFood = async () => {
    if (!validateForm()) return;

    try {
      const payload = {
        orderCode: food.orderCode.trim(),
        restaurantName: food.restaurantName.trim(),
        deliveryFee: Number(food.deliveryFee),
        delivered: food.delivered === 'true'
      };

      await axios.put(`${baseUrl}/update/${editId}`, payload);

      setMessage('Food order updated successfully.');
      resetForm();
      await fetchAllFoods();

      if (String(idToFetch) === String(editId)) {
        setFetchedFood(null);
      }
    } catch (error) {
      setMessage(
        error.response?.data || 'Error updating food order.'
      );
    }
  };

  const deleteFood = async (id) => {
    try {
      const res = await axios.delete(`${baseUrl}/delete/${id}`);

      setMessage(
        typeof res.data === 'string'
          ? res.data
          : 'Food order deleted successfully.'
      );

      if (String(idToFetch) === String(id)) {
        setFetchedFood(null);
      }

      if (String(editId) === String(id)) {
        resetForm();
      }

      await fetchAllFoods();
    } catch (error) {
      setMessage(
        error.response?.data || 'Error deleting food order.'
      );
    }
  };

  const getFoodById = async () => {
    if (!idToFetch || Number(idToFetch) <= 0) {
      setMessage('Please enter a valid food ID.');
      setFetchedFood(null);
      return;
    }

    try {
      const res = await axios.get(
        `${baseUrl}/display/${idToFetch}`
      );

      setFetchedFood(res.data);
      setMessage('');
    } catch {
      setFetchedFood(null);
      setMessage('Food order not found.');
    }
  };

  const handleEdit = (item) => {
    setFood({
      orderCode: item.orderCode ?? '',
      restaurantName: item.restaurantName ?? '',
      deliveryFee: String(item.deliveryFee ?? ''),
      delivered: String(item.delivered)
    });

    setEditId(item.id);
    setEditMode(true);
    setMessage(`Editing food order with ID ${item.id}.`);
  };

  return (
    <div className="food-container">
      <h2>Food Delivery Management</h2>

      {message && (
        <div
          className={`message-banner ${
            /error|failed|not found|please/i.test(message)
              ? 'error'
              : 'success'
          }`}
        >
          {message}
        </div>
      )}

      <section className="food-section">
        <h3>{editMode ? 'Edit Food Order' : 'Add Food Order'}</h3>

        {editMode && (
          <p className="food-edit-id">
            Food ID: {editId}
          </p>
        )}

        <div className="form-grid">
          <input
            type="text"
            name="orderCode"
            placeholder="Order Code"
            value={food.orderCode}
            onChange={handleChange}
          />

          <input
            type="text"
            name="restaurantName"
            placeholder="Restaurant Name"
            value={food.restaurantName}
            onChange={handleChange}
          />

          <input
            type="number"
            name="deliveryFee"
            placeholder="Delivery Fee"
            min="0"
            step="any"
            value={food.deliveryFee}
            onChange={handleChange}
          />

          <select
            name="delivered"
            value={food.delivered}
            onChange={handleChange}
          >
            <option value="">Select Delivery Status</option>
            <option value="true">Delivered</option>
            <option value="false">Not Delivered</option>
          </select>
        </div>

        <div className="btn-group">
          {!editMode ? (
            <button className="btn-blue" onClick={addFood}>
              Add Food Order
            </button>
          ) : (
            <>
              <button className="btn-green" onClick={updateFood}>
                Update Food Order
              </button>

              <button className="btn-gray" onClick={resetForm}>
                Cancel
              </button>
            </>
          )}
        </div>
      </section>

      <section className="food-section">
        <h3>Get Food Order By ID</h3>

        <div className="fetch-controls">
          <input
            type="number"
            min="1"
            value={idToFetch}
            onChange={(e) => setIdToFetch(e.target.value)}
            placeholder="Enter Food ID"
          />

          <button className="btn-blue" onClick={getFoodById}>
            Fetch
          </button>
        </div>

        {fetchedFood && (
          <div className="fetched-food">
            <h4>Food Order Found</h4>
            <pre>
              {JSON.stringify(fetchedFood, null, 2)}
            </pre>
          </div>
        )}
      </section>

      <section className="food-section">
        <h3>All Food Orders</h3>

        {foods.length === 0 ? (
          <p>No food orders found.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Order Code</th>
                  <th>Restaurant Name</th>
                  <th>Delivery Fee</th>
                  <th>Delivered</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {foods.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.orderCode}</td>
                    <td>{item.restaurantName}</td>
                    <td>{item.deliveryFee}</td>
                    <td>
                      <span
                        className={
                          item.delivered
                            ? 'status-delivered'
                            : 'status-pending'
                        }
                      >
                        {item.delivered ? 'Delivered' : 'Pending'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-green"
                          onClick={() => handleEdit(item)}
                        >
                          Edit
                        </button>

                        <button
                          className="btn-red"
                          onClick={() => deleteFood(item.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default FoodDeliveryManager;

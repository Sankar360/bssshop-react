// src/App.jsx
import { BrowserRouter } from 'react-router-dom';
import RouteStylesGate from './components/RouteStylesGate';
import AppRoutes from './routes/AppRoutes';

function App() {
    return (
        <BrowserRouter>
            <RouteStylesGate>
                <AppRoutes />
            </RouteStylesGate>
        </BrowserRouter>
    );
}

export default App;
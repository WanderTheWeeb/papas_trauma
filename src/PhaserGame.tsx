import { forwardRef, useEffect, useLayoutEffect, useRef } from 'react';
import StartGame from './game/main';
import { EventBus } from './game/EventBus';

export interface IRefPhaserGame
{
    game: Phaser.Game | null;
    scene: Phaser.Scene | null;
}

interface IProps
{
    currentActiveScene?: (scene_instance: Phaser.Scene) => void
}

export const PhaserGame = forwardRef<IRefPhaserGame, IProps>(function PhaserGame({ currentActiveScene }, ref)
{
    const game = useRef<Phaser.Game | null>(null!);

    useLayoutEffect(() =>
    {
        if (game.current === null)
        {

            game.current = StartGame("game-container");

            if (typeof ref === 'function')
            {
                ref({ game: game.current, scene: null });
            } else if (ref)
            {
                ref.current = { game: game.current, scene: null };
            }

        }

        // Refresh Phaser's scale calculation on resize / orientation change.
        // Without this, rotating the device or hiding the orient-overlay
        // leaves the canvas with the size it had at boot.
        const refresh = () => {
            game.current?.scale.refresh();
        };
        window.addEventListener('resize', refresh);
        window.addEventListener('orientationchange', refresh);
        // Several deferred refreshes catch the cases where the parent
        // container resolves its CSS dimensions a tick after mount.
        const t1 = window.setTimeout(refresh, 50);
        const t2 = window.setTimeout(refresh, 250);
        const t3 = window.setTimeout(refresh, 800);

        return () =>
        {
            window.removeEventListener('resize', refresh);
            window.removeEventListener('orientationchange', refresh);
            window.clearTimeout(t1);
            window.clearTimeout(t2);
            window.clearTimeout(t3);
            if (game.current)
            {
                game.current.destroy(true);
                if (game.current !== null)
                {
                    game.current = null;
                }
            }
        }
    }, [ref]);

    useEffect(() =>
    {
        EventBus.on('current-scene-ready', (scene_instance: Phaser.Scene) =>
        {
            if (currentActiveScene && typeof currentActiveScene === 'function')
            {

                currentActiveScene(scene_instance);

            }

            if (typeof ref === 'function')
            {

                ref({ game: game.current, scene: scene_instance });
            
            } else if (ref)
            {

                ref.current = { game: game.current, scene: scene_instance };

            }
            
        });
        return () =>
        {

            EventBus.removeListener('current-scene-ready');
        
        }
    }, [currentActiveScene, ref]);

    return (
        <div id="game-container"></div>
    );

});
